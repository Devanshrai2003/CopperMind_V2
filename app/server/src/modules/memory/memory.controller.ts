import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../../lib/apiResponse.js";
import {
  createMemory,
  updateMemory,
  deleteMemory,
  getMemoryById,
  getMemoryList,
  suggestTags,
} from "./memory.service.js";
import { ERROR_CODES } from "../../lib/apiErrors.js";
import {
  createMemorySchema,
  memoryQuerySchema,
  suggestTagsQuerySchema,
  updateMemorySchema,
} from "./memory.schema.js";

export async function getMemoriesHandler(req: Request, res: Response) {
  try {
    const parsed = memoryQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return errorResponse(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        parsed.error.message,
        400,
      );
    }

    const { limit, cursor, isPinned, type, tags } = parsed.data;

    const filters = {
      ...(isPinned !== undefined && {
        isPinned: isPinned,
      }),
      ...(type && { type: type }),
      ...(tags && { tags: tags }),
    };

    const memories = await getMemoryList(
      req.user.id,
      limit,
      cursor ? cursor : undefined,
      filters,
    );

    return successResponse(res, memories);
  } catch (error) {
    console.error("[GET_MEMORIES_ERROR]", error);

    return errorResponse(
      res,
      ERROR_CODES.INTERNAL_ERROR,
      "Unable to Fetch Memories",
      500,
    );
  }
}

export async function getMemoryHandler(req: Request, res: Response) {
  try {
    const { memoryId } = req.params;

    if (!memoryId) {
      return errorResponse(
        res,
        ERROR_CODES.BAD_REQUEST,
        "Invalid Memory ID",
        400,
      );
    }

    const memory = await getMemoryById(req.user.id, memoryId);

    return successResponse(res, memory);
  } catch (error) {
    console.error("[GET_MEMORY_BY_ID_ERROR]", error);

    return errorResponse(
      res,
      ERROR_CODES.INTERNAL_ERROR,
      "Unable to Fetch Memory",
      500,
    );
  }
}

export async function createMemoryHandler(req: Request, res: Response) {
  try {
    const parsed = createMemorySchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        parsed.error.message,
        400,
      );
    }

    const { type, title, url, content, tags } = parsed.data;

    const memory = await createMemory(
      req.user.id,
      type,
      title,
      content,
      url,
      tags,
    );

    return successResponse(res, memory, 201);
  } catch (error) {
    console.error("[CREATE_MEMORY_ERROR]", error);

    return errorResponse(
      res,
      ERROR_CODES.INTERNAL_ERROR,
      "Unable to Create Memory",
      500,
    );
  }
}

export async function updateMemoryHandler(req: Request, res: Response) {
  try {
    const { memoryId } = req.params;

    if (!memoryId) {
      return errorResponse(
        res,
        ERROR_CODES.BAD_REQUEST,
        "Invalid Memory ID",
        400,
      );
    }
    const parsed = updateMemorySchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        parsed.error.message,
        400,
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return errorResponse(
        res,
        ERROR_CODES.BAD_REQUEST,
        "No fields provided for update",
        400,
      );
    }

    const { title, url, content, tags } = parsed.data;

    const memory = await updateMemory(
      req.user.id,
      memoryId,
      title,
      content,
      url,
      tags,
    );

    return successResponse(res, memory, 200);
  } catch (error) {
    console.error("[UPDATE_MEMORY_ERROR]", error);

    return errorResponse(
      res,
      ERROR_CODES.INTERNAL_ERROR,
      "Unable to Update Memory",
      500,
    );
  }
}

export async function deleteMemoryHandler(req: Request, res: Response) {
  try {
    const { memoryId } = req.params;

    if (!memoryId) {
      return errorResponse(
        res,
        ERROR_CODES.BAD_REQUEST,
        "Invalid Memory ID",
        400,
      );
    }

    const deletedMemory = await deleteMemory(req.user.id, memoryId);

    return successResponse(res, deletedMemory, 200);
  } catch (error) {
    console.error("[DELETE_MEMORY_ERROR]", error);

    return errorResponse(
      res,
      ERROR_CODES.INTERNAL_ERROR,
      "Unable to Delete Memory",
      500,
    );
  }
}

export async function fetchTagSuggestions(req: Request, res: Response) {
  const parsed = suggestTagsQuerySchema.safeParse(req.body);

  if (!parsed.success) {
    return errorResponse(
      res,
      ERROR_CODES.VALIDATION_ERROR,
      parsed.error.message,
      400,
    );
  }

  const { title, content } = req.body;

  if (!title) {
    return errorResponse(
      res,
      ERROR_CODES.BAD_REQUEST,
      "Title Is Required For Tag Suggestions",
      400,
    );
  }
  const suggestions = suggestTags(title, content);
  return successResponse(res, suggestions, 200);
}
