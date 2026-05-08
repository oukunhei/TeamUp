import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./modules/auth/routes";
import userRoutes from "./modules/user/routes";
import spaceRoutes from "./modules/space/routes";
import ideaRoutes from "./modules/idea/routes";
import applicationRoutes from "./modules/application/routes";
import documentRoutes from "./modules/document/routes";
import timestampRoutes from "./modules/timestamp/routes";
import notificationRoutes from "./modules/notification/routes";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 健康检查
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API 路由
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/timestamps", timestampRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 和错误处理
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
