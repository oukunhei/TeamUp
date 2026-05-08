// @ts-nocheck  
import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { prisma } from "../../config/database";
import { z } from "zod";

const createSchema = z.object({
  ideaId: z.string().uuid(),
  message: z.string().max(2000).optional(),
});

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "VIEWER"]),
  reply: z.string().max(2000).optional(),
});

export const createApplication = async (req: AuthRequest, res: Response) => {
  const data = createSchema.parse(req.body);
  const userId = req.user!.id;

  const idea = await prisma.idea.findUnique({ where: { id: data.ideaId } });
  if (!idea) {
    res.status(404).json({ message: "创意不存在" });
    return;
  }
  if (idea.holderId === userId) {
    res.status(400).json({ message: "不能申请加入自己的项目" });
    return;
  }
  if (idea.status !== "PUBLISHED" && idea.status !== "RECRUITING") {
    res.status(400).json({ message: "该项目不在招募中" });
    return;
  }

  const existing = await prisma.application.findFirst({
    where: { ideaId: data.ideaId, userId, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existing) {
    res.status(400).json({ message: "已申请或已是成员" });
    return;
  }

  const app = await prisma.application.create({
    data: {
      ideaId: data.ideaId,
      userId,
      message: data.message,
      holderId: idea.holderId,
    },
    include: {
      idea: { select: { id: true, title: true } },
      user: { select: { id: true, name: true, avatar: true, skills: true } },
    },
  });

  // 发送通知给 Holder
  await prisma.notification.create({
    data: {
      userId: idea.holderId,
      type: "APPLICATION_RECEIVED",
      title: "收到新的加入申请",
      content: `${req.user!.name || "有人"} 申请加入「${idea.title}」`,
      meta: JSON.stringify({ applicationId: app.id, ideaId: idea.id }),
    },
  });

  res.status(201).json(app);
};

export const listMyApplications = async (req: AuthRequest, res: Response) => {
  const sent = await prisma.application.findMany({
    where: { userId: req.user!.id },
    include: {
      idea: {
        select: { id: true, title: true, summary: true, status: true, holder: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(sent);
};

export const listReceivedApplications = async (req: AuthRequest, res: Response) => {
  // 查询用户作为 Holder 的所有 Idea 收到的申请
  const ideas = await prisma.idea.findMany({
    where: { holderId: req.user!.id },
    select: { id: true },
  });
  const ideaIds = ideas.map((i) => i.id);

  const received = await prisma.application.findMany({
    where: { ideaId: { in: ideaIds } },
    include: {
      user: { select: { id: true, name: true, avatar: true, bio: true, skills: true } },
      idea: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(received);
};

export const reviewApplication = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = reviewSchema.parse(req.body);

  const application = await prisma.application.findUnique({
    where: { id },
    include: { idea: true },
  });
  if (!application) {
    res.status(404).json({ message: "申请不存在" });
    return;
  }
  if (application.idea.holderId !== req.user!.id) {
    res.status(403).json({ message: "无权审批" });
    return;
  }
  if (application.status !== "PENDING") {
    res.status(400).json({ message: "申请已处理" });
    return;
  }

  const isViewer = data.status === "VIEWER";
  const finalStatus = isViewer ? "APPROVED" : data.status;

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: finalStatus,
      reply: data.reply,
      isViewer,
      holderId: req.user!.id,
    },
    include: {
      user: { select: { id: true, name: true } },
      idea: { select: { id: true, title: true } },
    },
  });

  // 如果直接通过（非只读），添加为核心成员
  if (data.status === "APPROVED") {
    await prisma.ideaMember.create({
      data: { ideaId: application.ideaId, userId: application.userId, role: "MEMBER" },
    });
  }

  // 发送通知给申请者
  const notifyType =
    data.status === "APPROVED"
      ? "APPLICATION_APPROVED"
      : data.status === "REJECTED"
      ? "APPLICATION_REJECTED"
      : "APPLICATION_VIEWER";
  const notifyTitle =
    data.status === "APPROVED"
      ? "你的申请已通过"
      : data.status === "REJECTED"
      ? "你的申请被拒绝"
      : "你获得了只读权限";

  await prisma.notification.create({
    data: {
      userId: application.userId,
      type: notifyType,
      title: notifyTitle,
      content: `项目「${application.idea.title}」: ${data.reply || notifyTitle}`,
      meta: JSON.stringify({ applicationId: application.id, ideaId: application.ideaId }),
    },
  });

  res.json(updated);
};

// Holder 可以将已有只读权限的用户升级为正式成员
export const promoteViewer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: { idea: true },
  });
  if (!application) {
    res.status(404).json({ message: "申请不存在" });
    return;
  }
  if (application.idea.holderId !== req.user!.id) {
    res.status(403).json({ message: "无权操作" });
    return;
  }
  if (!application.isViewer) {
    res.status(400).json({ message: "该用户没有只读权限" });
    return;
  }

  await prisma.application.update({
    where: { id },
    data: { isViewer: false },
  });

  await prisma.ideaMember.create({
    data: { ideaId: application.ideaId, userId: application.userId, role: "MEMBER" },
  });

  await prisma.notification.create({
    data: {
      userId: application.userId,
      type: "MEMBER_JOINED",
      title: "你已成为项目核心成员",
      content: `项目「${application.idea.title}」: 你已被正式接纳为核心成员`,
      meta: JSON.stringify({ ideaId: application.ideaId }),
    },
  });

  res.json({ message: "已升级为核心成员" });
};

export const withdrawApplication = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) {
    res.status(404).json({ message: "申请不存在" });
    return;
  }
  if (application.userId !== req.user!.id) {
    res.status(403).json({ message: "无权撤回" });
    return;
  }
  if (application.status !== "PENDING") {
    res.status(400).json({ message: "只能撤回待处理申请" });
    return;
  }

  await prisma.application.update({
    where: { id },
    data: { status: "WITHDRAWN" },
  });

  res.json({ message: "已撤回" });
};
