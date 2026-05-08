// @ts-nocheck  
import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { prisma } from "../../config/database";
import { z } from "zod";

export const listNotifications = async (req: AuthRequest, res: Response) => {
  const { unreadOnly } = req.query;

  const notifications = await prisma.notification.findMany({
    where: {
      userId: req.user!.id,
      ...(unreadOnly === "true" && { isRead: false }),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  res.json(notifications);
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await prisma.notification.updateMany({
    where: { id, userId: req.user!.id },
    data: { isRead: true },
  });

  res.json({ message: "已标记为已读" });
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });

  res.json({ message: "全部已读" });
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.id, isRead: false },
  });

  res.json({ count });
};
