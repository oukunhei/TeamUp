// @ts-nocheck  
import { Request, Response } from "express";
import { prisma } from "../../config/database";
import crypto from "crypto";

export const getCertificate = async (req: Request, res: Response) => {
  const { hash } = req.params;

  const idea = await prisma.idea.findUnique({
    where: { hash },
    include: {
      holder: { select: { id: true, name: true, avatar: true } },
    },
  }) as any;

  if (!idea) {
    res.status(404).json({ message: "证书不存在" });
    return;
  }

  res.json({
    hash: idea.hash,
    title: idea.title,
    summary: idea.summary,
    holder: idea.holder,
    timestampedAt: idea.timestampedAt,
    verified: true,
  });
};

export const verifyTimestamp = async (req: Request, res: Response) => {
  const { hash, title, summary, holderId, timestamp } = req.body;

  if (!hash || !title || !summary || !holderId || !timestamp) {
    res.status(400).json({ message: "缺少验证参数" });
    return;
  }

  const computed = crypto
    .createHash("sha256")
    .update(`${title}|${summary}|${holderId}|${timestamp}`)
    .digest("hex");

  const valid = computed === hash;
  const idea = await prisma.idea.findUnique({ where: { hash } });

  res.json({
    valid,
    computedHash: computed,
    storedHash: hash,
    existsInDb: !!idea,
    timestampedAt: idea?.timestampedAt || null,
  });
};
