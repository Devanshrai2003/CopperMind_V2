import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { errorResponse } from "../../lib/apiResponse";
import { ERROR_CODES } from "../../lib/apiErrors";

export async function resolveUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.user = null;
  req.session = null;

  const sessionId = req.cookies.session_id;
  if (!sessionId) {
    return next();
  }

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    res.clearCookie("session_id");
    return next();
  }

  const currentDate = new Date();

  if (session.expiresAt < currentDate) {
    await prisma.session.delete({
      where: { id: session.id },
    });
    res.clearCookie("session_id");
    return next();
  }

  req.user = session.user;
  req.session = session;

  return next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return errorResponse(
      res,
      ERROR_CODES.AUTH_REQUIRED,
      "Authentication required",
      401
    );
  }

  return next();
}

export function requireNonGuest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return errorResponse(
      res,
      ERROR_CODES.AUTH_REQUIRED,
      "Authentication required",
      401
    );
  }

  if (req.user.isGuest) {
    return errorResponse(
      res,
      ERROR_CODES.FORBIDDEN,
      "Only Accessible To Users",
      403
    );
  }

  return next();
}
