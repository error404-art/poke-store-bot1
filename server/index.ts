import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  const port = process.env.PORT || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Bot server running on port ${port}`);
  });
})();