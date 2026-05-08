import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/database";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "未提供认证令牌" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      res.status(401).json({ message: "用户不存在" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "认证失败", error: String(error) });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "未认证" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "权限不足" });
      return;
    }
    next();
  };
};
