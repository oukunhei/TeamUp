// @ts-nocheck  
import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { prisma } from "../../config/database";
import {
  uploadFile,
  deleteFile,
  getFilePath,
  generateStorageKey,
  fileExists,
} from "../../config/storage";
import { z } from "zod";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";

const uploadSchema = z.object({
  ideaId: z.string().uuid(),
  name: z.string().min(1).max(255),
  comment: z.string().max(500).optional(),
});

// 检查用户对 Idea 的权限级别
async function getIdeaPermission(ideaId: string, userId: string | undefined) {
  if (!userId) return { isMember: false, isViewer: false, isHolder: false };

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: {
      members: { where: { userId } },
      applications: { where: { userId, status: "APPROVED", isViewer: true } },
    },
  });
  if (!idea) return { isMember: false, isViewer: false, isHolder: false };

  const isHolder = idea.holderId === userId;
  const isMember = isHolder || idea.members.length > 0;
  const isViewer = isMember || idea.applications.length > 0;
  return { isHolder, isMember, isViewer };
}

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: "未上传文件" });
    return;
  }

  const data = uploadSchema.parse(req.body);
  const { isMember } = await getIdeaPermission(data.ideaId, req.user!.id);
  if (!isMember) {
    res.status(403).json({ message: "无权上传文档" });
    return;
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fileHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

  // 查找是否已存在同名文档
  const existing = await prisma.document.findFirst({
    where: { ideaId: data.ideaId, name: data.name },
  });

  if (existing) {
    // 归档当前版本到 DocumentVersion
    await prisma.documentVersion.create({
      data: {
        documentId: existing.id,
        versionNumber: existing.version,
        storageKey: existing.path,
        fileSize: existing.size,
        fileHash: existing.fileHash,
        uploadedBy: existing.uploadedBy,
        comment: `自动归档 v${existing.version}`,
      },
    });

    const newVersion = existing.version + 1;
    const storageKey = generateStorageKey(data.ideaId, existing.id, newVersion, ext);
    await uploadFile(storageKey, req.file.buffer, req.file.mimetype);

    const updated = await prisma.document.update({
      where: { id: existing.id },
      data: {
        mimeType: req.file.mimetype,
        path: storageKey,
        size: req.file.size,
        fileHash,
        version: newVersion,
        uploadedBy: req.user!.id,
      },
      include: {
        uploader: { select: { id: true, name: true } },
      },
    });

    // 通知项目成员
    const idea = await prisma.idea.findUnique({
      where: { id: data.ideaId },
      include: { members: true },
    });
    if (idea) {
      const notifyTargets = new Set(idea.members.map((m) => m.userId));
      notifyTargets.add(idea.holderId);
      notifyTargets.delete(req.user!.id);
      for (const uid of notifyTargets) {
        await prisma.notification.create({
          data: {
            userId: uid,
            type: "DOCUMENT_UPLOADED",
            title: "文档已更新",
            content: `「${data.name}」上传了新版本 v${newVersion}`,
            meta: JSON.stringify({ documentId: existing.id, ideaId: data.ideaId }),
          },
        });
      }
    }

    res.json(updated);
    return;
  }

  // 新建文档
  const doc = await prisma.document.create({
    data: {
      ideaId: data.ideaId,
      name: data.name,
      type: ext.replace(".", "") || "unknown",
      mimeType: req.file.mimetype,
      path: "", // 占位，后续更新
      size: req.file.size,
      fileHash,
      version: 1,
      uploadedBy: req.user!.id,
    },
  });

  const storageKey = generateStorageKey(data.ideaId, doc.id, 1, ext);
  await uploadFile(storageKey, req.file.buffer, req.file.mimetype);

  const finalDoc = await prisma.document.update({
    where: { id: doc.id },
    data: { path: storageKey },
    include: {
      uploader: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(finalDoc);
};

export const listDocuments = async (req: AuthRequest, res: Response) => {
  const { ideaId } = req.params;
  const { isViewer } = await getIdeaPermission(ideaId, req.user?.id);
  if (!isViewer) {
    res.status(403).json({ message: "无权查看文档" });
    return;
  }

  const docs = await prisma.document.findMany({
    where: { ideaId },
    include: {
      uploader: { select: { id: true, name: true } },
      _count: { select: { versions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json(docs);
};

export const getDocument = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      uploader: { select: { id: true, name: true } },
      idea: { select: { id: true, title: true, holderId: true } },
    },
  });
  if (!doc) {
    res.status(404).json({ message: "文档不存在" });
    return;
  }

  const { isViewer, isMember } = await getIdeaPermission(doc.ideaId, req.user?.id);
  if (!isViewer) {
    res.status(403).json({ message: "无权查看" });
    return;
  }

  // 只有核心成员可以下载/查看原始文件
  const canDownload = isMember;

  res.json({ ...doc, canDownload });
};

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { idea: { select: { id: true, holderId: true } } },
  });
  if (!doc) {
    res.status(404).json({ message: "文档不存在" });
    return;
  }

  const { isMember } = await getIdeaPermission(doc.ideaId, req.user?.id);
  if (!isMember) {
    res.status(403).json({ message: "仅核心成员可下载" });
    return;
  }

  const filePath = getFilePath(doc.path);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.name)}"`);
  res.setHeader("Content-Type", doc.mimeType);
  res.sendFile(filePath);
};

export const previewDocument = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { idea: { select: { id: true, holderId: true } } },
  });
  if (!doc) {
    res.status(404).json({ message: "文档不存在" });
    return;
  }

  const { isViewer } = await getIdeaPermission(doc.ideaId, req.user?.id);
  if (!isViewer) {
    res.status(403).json({ message: "无权预览" });
    return;
  }

  const filePath = getFilePath(doc.path);

  // 图片和 PDF 直接返回
  if (doc.mimeType.startsWith("image/") || doc.mimeType === "application/pdf") {
    res.setHeader("Content-Type", doc.mimeType);
    const buffer = await fs.readFile(filePath);
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'self' 'unsafe-inline'");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
    return;
  }

  // Markdown 和代码文件返回文本内容
  if (
    doc.mimeType === "text/markdown" ||
    doc.mimeType === "text/plain" ||
    doc.type === "md" ||
    doc.type === "txt" ||
    ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "go", "rs", "html", "css", "json"].includes(doc.type)
  ) {
    const text = await fs.readFile(filePath, "utf-8");
    res.json({ type: "text", mimeType: doc.mimeType, content: text });
    return;
  }

  // Office 文档暂不支持在线预览，返回提示
  res.json({ type: "unsupported", mimeType: doc.mimeType, message: "该文件类型暂不支持在线预览，请下载后查看" });
};

export const listVersions = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { idea: { select: { id: true } } },
  });
  if (!doc) {
    res.status(404).json({ message: "文档不存在" });
    return;
  }

  const { isViewer } = await getIdeaPermission(doc.ideaId, req.user?.id);
  if (!isViewer) {
    res.status(403).json({ message: "无权查看" });
    return;
  }

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: id },
    include: {
      uploader: { select: { id: true, name: true } },
    },
    orderBy: { versionNumber: "desc" },
  });

  // 当前版本也加入列表
  const current = {
    id: "current",
    documentId: doc.id,
    versionNumber: doc.version,
    storageKey: doc.path,
    fileSize: doc.size,
    fileHash: doc.fileHash,
    uploadedBy: doc.uploadedBy,
    comment: "当前版本",
    createdAt: doc.updatedAt,
    uploader: null,
  };

  res.json([current, ...versions]);
};

export const rollbackVersion = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { versionNumber } = z.object({ versionNumber: z.number().int().positive() }).parse(req.body);

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { idea: { select: { id: true, holderId: true } } },
  });
  if (!doc) {
    res.status(404).json({ message: "文档不存在" });
    return;
  }

  const { isMember } = await getIdeaPermission(doc.ideaId, req.user?.id);
  if (!isMember) {
    res.status(403).json({ message: "仅核心成员可回滚" });
    return;
  }

  const target = await prisma.documentVersion.findFirst({
    where: { documentId: id, versionNumber },
  });
  if (!target) {
    res.status(404).json({ message: "版本不存在" });
    return;
  }

  const exists = await fileExists(target.storageKey);
  if (!exists) {
    res.status(404).json({ message: "版本文件已丢失" });
    return;
  }

  // 归档当前版本
  await prisma.documentVersion.create({
    data: {
      documentId: doc.id,
      versionNumber: doc.version + 1,
      storageKey: doc.path,
      fileSize: doc.size,
      fileHash: doc.fileHash,
      uploadedBy: doc.uploadedBy,
      comment: `回滚前自动归档 v${doc.version}`,
    },
  });

  const newVersion = doc.version + 2;
  const ext = path.extname(doc.name) || `.${doc.type}`;
  const newKey = generateStorageKey(doc.ideaId, doc.id, newVersion, ext);

  // 复制目标版本文件到新 key
  const buffer = await fs.readFile(getFilePath(target.storageKey));
  await uploadFile(newKey, buffer, doc.mimeType);

  const updated = await prisma.document.update({
    where: { id },
    data: {
      path: newKey,
      size: target.fileSize,
      fileHash: target.fileHash,
      version: newVersion,
      uploadedBy: req.user!.id,
    },
    include: {
      uploader: { select: { id: true, name: true } },
    },
  });

  res.json(updated);
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { idea: { select: { id: true, holderId: true } } },
  });
  if (!doc) {
    res.status(404).json({ message: "文档不存在" });
    return;
  }

  const { isHolder } = await getIdeaPermission(doc.ideaId, req.user?.id);
  if (!isHolder) {
    res.status(403).json({ message: "仅 Holder 可删除文档" });
    return;
  }

  await deleteFile(doc.path);
  await prisma.documentVersion.deleteMany({ where: { documentId: id } });
  await prisma.document.delete({ where: { id } });

  res.json({ message: "已删除" });
};
