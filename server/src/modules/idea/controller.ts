// @ts-nocheck  
import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { prisma } from "../../config/database";
import { z } from "zod";
import crypto from "crypto";

const createIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  detail: z.string().optional(),
  requiredSkills: z.array(z.string()).optional().default([]),
  teamSize: z.number().int().min(1).max(20).optional(),
  spaceId: z.string().optional(),
});

const updateIdeaSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().min(1).max(2000).optional(),
  detail: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  teamSize: z.number().int().min(1).max(20).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "RECRUITING", "IN_PROGRESS", "COMPLETED"]).optional(),
});

// 生成时间戳 Hash
const generateTimestampHash = (
  title: string,
  summary: string,
  holderId: string,
  timestamp: string
) => {
  return crypto
    .createHash("sha256")
    .update(`${title}|${summary}|${holderId}|${timestamp}`)
    .digest("hex");
};

export const createIdea = async (req: AuthRequest, res: Response) => {
  const data = createIdeaSchema.parse(req.body);

  const idea = await prisma.idea.create({
    data: {
      ...data,
      holderId: req.user!.id,
      status: "DRAFT",
    },
    include: {
      holder: { select: { id: true, name: true, avatar: true } },
      space: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(idea);
};

export const listIdeas = async (req: Request, res: Response) => {
  const { status, spaceId, skill, search, holderId } = req.query;

  const ideas = await prisma.idea.findMany({
    where: {
      status: status ? (status as string) : holderId ? undefined : { in: ["PUBLISHED", "RECRUITING", "IN_PROGRESS"] },
      ...(holderId && { holderId: holderId as string }),
      ...(spaceId && { spaceId: spaceId as string }),
      ...(skill && { requiredSkills: { has: skill as string } }),
      ...(search && {
        OR: [
          { title: { contains: search as string, mode: "insensitive" } },
          { summary: { contains: search as string, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      holder: { select: { id: true, name: true, avatar: true } },
      space: { select: { id: true, name: true } },
      _count: { select: { applications: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(ideas);
};

export const getIdea = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      holder: { select: { id: true, name: true, avatar: true, bio: true, skills: true } },
      space: { select: { id: true, name: true, type: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true, skills: true } } },
      },
      documents: {
        select: { id: true, name: true, type: true, size: true, createdAt: true, uploadedBy: true },
      },
      _count: { select: { applications: true, members: true } },
    },
  });

  if (!idea) {
    res.status(404).json({ message: "创意不存在" });
    return;
  }

  // 权限判断
  const isHolder = idea.holderId === userId;
  const isMember = isHolder || idea.members.some((m) => m.userId === userId);

  // 如果是 Holder，单独查询该项目的申请列表
  let applications = undefined;
  if (isHolder) {
    applications = await prisma.application.findMany({
      where: { ideaId: id, status: { not: "WITHDRAWN" } },
      include: {
        user: { select: { id: true, name: true, avatar: true, bio: true, skills: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // 检查是否为审批通过的 Viewer（只读权限）
  let isViewer = false;
  if (!isMember && userId) {
    const app = await prisma.application.findFirst({
      where: {
        ideaId: id,
        userId,
        status: "APPROVED",
        isViewer: true,
      },
    });
    isViewer = !!app;
  }

  // 非成员且非 Viewer 只能看概述
  if (!isMember && !isViewer) {
    res.json({
      ...idea,
      detail: undefined,
      documents: [],
      applications,
    });
    return;
  }

  // Viewer 可以看详情和文档列表，但不能下载
  if (isViewer) {
    res.json({
      ...idea,
      viewerMode: true,
      canEdit: false,
      canUpload: false,
      canDownload: false,
      applications,
    });
    return;
  }

  res.json({
    ...idea,
    viewerMode: false,
    canEdit: isHolder || isMember,
    canUpload: isHolder || isMember,
    canDownload: isHolder || isMember,
    applications,
  });
};

export const updateIdea = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateIdeaSchema.parse(req.body);

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    res.status(404).json({ message: "创意不存在" });
    return;
  }
  if (idea.holderId !== req.user!.id) {
    res.status(403).json({ message: "无权修改" });
    return;
  }

  const updated = await prisma.idea.update({
    where: { id },
    data,
    include: {
      holder: { select: { id: true, name: true } },
      space: { select: { id: true, name: true } },
    },
  });

  res.json(updated);
};

export const publishIdea = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    res.status(404).json({ message: "创意不存在" });
    return;
  }
  if (idea.holderId !== req.user!.id) {
    res.status(403).json({ message: "无权发布" });
    return;
  }

  const now = new Date().toISOString();
  const hash = generateTimestampHash(idea.title, idea.summary, idea.holderId, now);

  const updated = await prisma.idea.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      hash,
      timestampedAt: new Date(now),
    },
    include: {
      holder: { select: { id: true, name: true } },
    },
  });

  res.json(updated);
};

export const deleteIdea = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    res.status(404).json({ message: "创意不存在" });
    return;
  }
  if (idea.holderId !== req.user!.id) {
    res.status(403).json({ message: "无权删除" });
    return;
  }

  await prisma.idea.delete({ where: { id } });
  res.json({ message: "已删除" });
};
