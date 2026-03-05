import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRouter from "./modules/auth/auth.routes.js";
import memoryRouter from "./modules/memory/memory.routes.js";
import { resolveUser } from "./modules/auth/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(resolveUser);

app.get("/", (req, res) => {
  res.send("CopperMind Backend Online");
});

app.use("/auth", authRouter);
app.use("/memories", authRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
