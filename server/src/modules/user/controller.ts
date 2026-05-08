// @ts-nocheck  
import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { prisma } from "../../config/database";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  avatar: z.string().optional(),
});

export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      studentId: true,
      avatar: true,
      bio: true,
      skills: true,
      role: true,
      createdAt: true,
    },
  });
  res.json(user);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const data = updateProfileSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      studentId: true,
      avatar: true,
      bio: true,
      skills: true,
      role: true,
    },
  });
  res.json(user);
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      skills: true,
      createdAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ message: "用户不存在" });
    return;
  }
  res.json(user);
};
