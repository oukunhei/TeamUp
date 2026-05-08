import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  studentId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
  );
  const refreshToken = jwt.sign(
    { userId, type: "refresh" },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
  );
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      res.status(400).json({ message: "邮箱已被注册" });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        studentId: data.studentId,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const tokens = generateTokens(user.id, user.email, user.role);
    res.status(201).json({ user, ...tokens });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "参数错误", errors: error.errors });
      return;
    }
    throw error;
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      res.status(401).json({ message: "邮箱或密码错误" });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      res.status(401).json({ message: "邮箱或密码错误" });
      return;
    }

    const tokens = generateTokens(user.id, user.email, user.role);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "参数错误", errors: error.errors });
      return;
    }
    throw error;
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ message: "缺少刷新令牌" });
      return;
    }

    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== "refresh") {
      res.status(401).json({ message: "无效的刷新令牌" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      res.status(401).json({ message: "用户不存在" });
      return;
    }

    const tokens = generateTokens(user.id, user.email, user.role);
    res.json(tokens);
  } catch {
    res.status(401).json({ message: "刷新令牌无效或已过期" });
  }
};
