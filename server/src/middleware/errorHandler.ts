import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "服务器内部错误";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `路由未找到: ${req.method} ${req.path}`,
  });
};
