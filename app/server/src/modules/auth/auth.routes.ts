import { Router } from "express";
import { guestLogin, login, signup } from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/guest", guestLogin);
authRouter.post("/signup", signup);
authRouter.post("/login", login);

export default authRouter;
