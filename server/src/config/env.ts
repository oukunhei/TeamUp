import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-key",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT || "localhost",
  STORAGE_PORT: parseInt(process.env.STORAGE_PORT || "9000", 10),
  STORAGE_USE_SSL: process.env.STORAGE_USE_SSL === "true",
  STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY || "",
  STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY || "",
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || "teamup",
};
