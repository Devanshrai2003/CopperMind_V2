import type { Request, Response } from "express";
import {
  createGuestUser,
  loginWithCredentials,
  signupWithCredentials,
} from "./auth.service.js";
import { errorResponse, successResponse } from "../../lib/apiResponse.js";
import { ERROR_CODES } from "../../lib/apiErrors.js";

export async function guestLogin(req: Request, res: Response) {
  const { user, session } = await createGuestUser();

  res.cookie("session_id", session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: session.expiresAt,
  });

  return successResponse(res, user, 201);
}

export async function signup(req: Request, res: Response) {
  const { email, password } = req.body;
  const currentUser = req.user;

  try {
    const { user, session } = await signupWithCredentials(
      { email, password },
      currentUser?.isGuest ? currentUser.id : undefined
    );

    res.cookie("session_id", session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: session.expiresAt,
    });

    return successResponse(res, user, 201);
  } catch (error: any) {
    return errorResponse(res, ERROR_CODES.VALIDATION_ERROR, error.message, 400);
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const { user, session } = await loginWithCredentials(email, password);

    res.cookie("session_id", session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: session.expiresAt,
    });

    return successResponse(res, user, 200);
  } catch (error: any) {
    return errorResponse(
      res,
      ERROR_CODES.AUTH_REQUIRED,
      "Invalid Credentials",
      401
    );
  }
}
