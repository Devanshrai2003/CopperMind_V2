import { Router } from "express";
import {
  githubCallback,
  googleCallback,
  guestLogin,
  login,
  loginWithGithub,
  loginWithGoogle,
  signup,
} from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/guest", guestLogin);
authRouter.post("/signup", signup);
authRouter.post("/login", login);

// Google OAuth
authRouter.get("/google", loginWithGoogle);
authRouter.get("/google/callback", googleCallback);

// GitHub OAuth
authRouter.get("/github", loginWithGithub);
authRouter.get("/github/callback", githubCallback);

export default authRouter;
