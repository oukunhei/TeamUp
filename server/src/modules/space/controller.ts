// @ts-nocheck  
import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { prisma } from "../../config/database";
import { z } from "zod";
import { randomBytes } from "crypto";

const createSpaceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["OPEN", "COURSE"]),
  courseCode: z.string().optional(),
  courseName: z.string().optional(),
  semester: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
});

const joinSpaceSchema = z.object({
  joinCode: z.string().min(1),
});

export const createSpace = async (req: AuthRequest, res: Response) => {
  const data = createSpaceSchema.parse(req.body);
  const joinCode = randomBytes(4).toString("hex").toUpperCase();

  const space = await prisma.space.create({
    data: {
      ...data,
      owner: { connect: { id: req.user!.id } },
      joinCode: data.type === "COURSE" ? joinCode : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true } },
    },
  });

  // 创建者自动成为成员
  await prisma.spaceMember.create({
    data: {
      spaceId: space.id,
      userId: req.user!.id,
      role: data.type === "COURSE" ? "TEACHER" : "MEMBER",
    },
  });

  res.status(201).json(space);
};

export const listSpaces = async (req: AuthRequest, res: Response) => {
  const { type } = req.query;
  const spaces = await prisma.space.findMany({
    where: {
      ...(type && { type: type as "OPEN" | "COURSE" }),
      OR: [
        { isPublic: true },
        { members: { some: { userId: req.user!.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { members: true, ideas: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(spaces);
};

export const getSpace = async (req: Request, res: Response) => {
  const { id } = req.params;
  const space = await prisma.space.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true, skills: true } } },
      },
      ideas: {
        where: { status: { in: ["PUBLISHED", "RECRUITING", "IN_PROGRESS"] } },
        select: { id: true, title: true, summary: true, status: true, createdAt: true },
      },
      _count: { select: { members: true, ideas: true } },
    },
  });
  if (!space) {
    res.status(404).json({ message: "空间不存在" });
    return;
  }
  res.json(space);
};

export const joinSpace = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { joinCode } = joinSpaceSchema.parse(req.body);

  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) {
    res.status(404).json({ message: "空间不存在" });
    return;
  }

  if (space.type === "COURSE" && space.joinCode !== joinCode) {
    res.status(403).json({ message: "邀请码错误" });
    return;
  }

  const existing = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId: id, userId: req.user!.id } },
  });
  if (existing) {
    res.status(400).json({ message: "已经是空间成员" });
    return;
  }

  await prisma.spaceMember.create({
    data: { spaceId: id, userId: req.user!.id, role: "MEMBER" },
  });

  res.json({ message: "加入成功" });
};
