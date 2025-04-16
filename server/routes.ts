import type { Express } from "express";
import { createServer, type Server } from "http";
import { startBot } from "./bot";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    console.error("DISCORD_BOT_TOKEN not found in environment variables");
  } else {
    startBot(token);
  }

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return httpServer;
}