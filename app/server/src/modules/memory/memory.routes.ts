import { Router } from "express";
import {
  getMemoriesHandler,
  getMemoryHandler,
  createMemoryHandler,
  updateMemoryHandler,
  deleteMemoryHandler,
  fetchTagSuggestions,
} from "./memory.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

const memoryRouter = Router();

memoryRouter.get("/", requireAuth, getMemoriesHandler);
memoryRouter.get("/:memoryId", requireAuth, getMemoryHandler);
memoryRouter.post("/", requireAuth, createMemoryHandler);
memoryRouter.patch("/:memoryId", requireAuth, updateMemoryHandler);
memoryRouter.delete("/:memoryId", requireAuth, deleteMemoryHandler);

memoryRouter.post("/suggest-tags", requireAuth, fetchTagSuggestions);

export default memoryRouter;
