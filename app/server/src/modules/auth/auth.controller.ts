import type { Request, Response } from "express";
import {
  createGuestUser,
  handleOauthUser,
  loginWithCredentials,
  signupWithCredentials,
  verifyGitHubCode,
  verifyGoogleCode,
} from "./auth.service.js";
import { errorResponse, successResponse } from "../../lib/apiResponse.js";
import { ERROR_CODES } from "../../lib/apiErrors.js";
import type { User } from "../../generated/prisma/client.js";
import { generateCodeVerifier, generateState } from "arctic";
import { github, google } from "../../lib/arctic.js";

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
      currentUser?.isGuest ? currentUser.id : undefined,
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
      401,
    );
  }
}

//####################################################################
const FRONTEND_DASHBOARD_URL =
  process.env.FRONTEND_URL || "http://localhost:5173/dashboard";
//####################################################################

// --- GOOGLE OAUTH ---
export async function loginWithGoogle(req: Request, res: Response) {
  const state = generateState();
  const scopes = ["profile", "email"];
  const codeVerifier = generateCodeVerifier(); // Google requires PKCE
  const url = google.createAuthorizationURL(state, codeVerifier, scopes);

  // Save state and codeVerifier in temporary cookies
  res.cookie("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10 * 1000,
    path: "/",
  });

  res.cookie("google_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10 * 1000,
    path: "/",
  });

  res.redirect(url.toString());
}

export async function googleCallback(req: Request, res: Response) {
  const code = req.query.code?.toString() ?? null;
  const state = req.query.state?.toString() ?? null;
  const storedState = req.cookies?.google_oauth_state ?? null;
  const storedCodeVerifier = req.cookies?.google_code_verifier ?? null;

  // Verify State
  if (
    !code ||
    !state ||
    !storedState ||
    state !== storedState ||
    !storedCodeVerifier
  ) {
    return res.status(400).send("Invalid state or code");
  }

  try {
    const profile = await verifyGoogleCode(code, storedCodeVerifier);

    const currentUser = req.user as User;
    const { session } = await handleOauthUser(
      {
        provider: "google",
        providerId: profile.id,
        email: profile.email,
      },
      currentUser?.isGuest ? currentUser.id : undefined,
    );

    res.cookie("session_id", session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: session.expiresAt,
    });

    res.redirect(FRONTEND_DASHBOARD_URL);
  } catch (error) {
    console.error(error);
    res.redirect(`${FRONTEND_DASHBOARD_URL}?error=OAuthFailed`);
  }
}

// ####################

// --- GITHUB OAUTH ---
export async function loginWithGithub(req: Request, res: Response) {
  const state = generateState();
  const scopes = ["user:email"];
  const url = github.createAuthorizationURL(state, scopes);

  // Save the state in a temporary cookie (expires in 10 minutes)
  res.cookie("github_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10 * 1000,
    path: "/",
  });

  res.redirect(url.toString());
}

// --- GITHUB CALLBACK ---
export async function githubCallback(req: Request, res: Response) {
  const code = req.query.code?.toString() ?? null;
  const state = req.query.state?.toString() ?? null;
  const storedState = req.cookies?.github_oauth_state ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    return res.status(400).send("Invalid state or code");
  }

  try {
    // 2. Exchange Code for Profile
    const profile = await verifyGitHubCode(code);

    // 3. Database Logic (Create/Link User)
    const currentUser = req.user as User;
    const { session } = await handleOauthUser(
      {
        provider: "github",
        providerId: profile.id,
        email: profile.email!,
      },
      currentUser?.isGuest ? currentUser.id : undefined,
    );

    res.cookie("session_id", session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: session.expiresAt,
    });

    res.redirect(FRONTEND_DASHBOARD_URL);
  } catch (error) {
    console.error(error);
    res.redirect(`${FRONTEND_DASHBOARD_URL}?error=OAuthFailed`);
  }
}
