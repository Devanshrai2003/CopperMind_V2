import "express";
import type { Session, User } from "../src/generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      user?: User | null;
      session?: Session | null;
    }
  }
}

export {};
