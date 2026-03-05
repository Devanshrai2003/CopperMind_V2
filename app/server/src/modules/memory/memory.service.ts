import { MemoryType } from "../../generated/prisma/enums.js";
import { gemini } from "../../lib/googleGenAi.js";
import { prisma } from "../../lib/prisma.js";
import { normalizeTags } from "./memory.utils.js";

export async function createMemory(
  userId: string,
  type: MemoryType,
  title?: string,
  content?: string,
  url?: string,
  tags?: string[],
) {
  if (type === MemoryType.NOTE && !content) {
    throw new Error("Content is required for Notes");
  }

  if (type === MemoryType.LINK && !url) {
    throw new Error("URL is required for Links");
  }

  const data = await prisma.$transaction(async (tx) => {
    const memory = await tx.memory.create({
      data: {
        userId,
        type,
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(url !== undefined && { url }),
      },
    });

    const normalizedTags = normalizeTags(tags);

    if (normalizedTags.length > 0) {
      const tagRecords = await Promise.all(
        normalizedTags.map((tag) =>
          tx.tag.upsert({
            where: { name: tag },
            update: {},
            create: { name: tag },
          }),
        ),
      );

      await tx.memoryTag.createMany({
        data: tagRecords.map((tag) => ({
          memoryId: memory.id,
          tagId: tag.id,
        })),
        skipDuplicates: true,
      });
    }
    return { memory, tags: normalizedTags };
  });

  return data;
}

export async function updateMemory(
  userId: string,
  memoryId: string,
  title?: string,
  content?: string,
  url?: string,
  tags?: string[],
) {
  const data = await prisma.$transaction(async (tx) => {
    const memory = await tx.memory.findFirst({
      where: { id: memoryId, userId: userId, deletedAt: null },
    });

    if (!memory) {
      throw new Error("Memory Not Found");
    }

    const finalContent = content ?? memory.content;
    const finalUrl = url ?? memory.url;

    switch (memory.type) {
      case MemoryType.NOTE:
        if (!finalContent || finalContent.trim().length === 0) {
          throw new Error("Content is required for Notes");
        }
        break;

      case MemoryType.LINK:
        if (!finalUrl || finalUrl.trim().length === 0) {
          throw new Error("URL is required for Links");
        }
        break;
    }

    const updatedMemory = await tx.memory.update({
      where: { id: memoryId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(url !== undefined && { url }),
      },
    });

    if (tags !== undefined) {
      const normalizedTags = normalizeTags(tags);

      if (normalizedTags.length > 0) {
        const tagRecords = await Promise.all(
          normalizedTags.map((tag) =>
            tx.tag.upsert({
              where: { name: tag },
              update: {},
              create: { name: tag },
            }),
          ),
        );

        await tx.memoryTag.deleteMany({
          where: { memoryId },
        });

        await tx.memoryTag.createMany({
          data: tagRecords.map((tag) => ({
            memoryId: memory.id,
            tagId: tag.id,
          })),
          skipDuplicates: true,
        });
        return { memory: updatedMemory, tags: normalizedTags };
      }
    }
  });

  return data;
}

export async function deleteMemory(
  userId: string,
  memoryId: string,
): Promise<{ id: string }> {
  const data = await prisma.$transaction(async (tx) => {
    const memory = await tx.memory.findFirst({
      where: { id: memoryId, userId: userId, deletedAt: null },
    });

    if (!memory) {
      throw new Error("Memory Not Found");
    }

    const deletedMemory = await tx.memory.update({
      where: { id: memoryId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { id: deletedMemory.id };
  });

  return data;
}

export async function getMemoryById(userId: string, memoryId: string) {
  const memory = await prisma.memory.findFirst({
    where: { id: memoryId, userId: userId, deletedAt: null },
  });

  if (!memory) {
    throw new Error("Memory Not Found");
  }

  const memoryTags = await prisma.memoryTag.findMany({
    where: { memoryId: memoryId },
    include: {
      tag: true,
    },
  });

  const tags = memoryTags.map((mt) => mt.tag.name);

  return {
    id: memory.id,
    type: memory.type,
    title: memory.title,
    content: memory.content,
    url: memory.url,
    isPinned: memory.isPinned,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
    tags,
  };
}

export async function getMemoryList(
  userId: string,
  limit?: number,
  cursor?: {
    isPinned: boolean;
    updatedAt: Date;
    id: string;
  },
  filters?: {
    isPinned?: boolean;
    type?: MemoryType;
    tags?: string[];
  },
) {
  const safeLimit = Math.min(Math.max(limit ?? 20, 1), 50);

  const memoryList = await prisma.memory.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.isPinned !== undefined && { isPinned: filters.isPinned }),
      ...(filters?.tags?.length && {
        memoryTags: {
          some: {
            tag: {
              name: {
                in: filters.tags,
              },
            },
          },
        },
      }),
      ...(cursor && {
        OR: [
          ...(cursor.isPinned === true ? [{ isPinned: false }] : []),

          {
            isPinned: cursor.isPinned,
            updatedAt: { lt: cursor.updatedAt },
          },

          {
            isPinned: cursor.isPinned,
            updatedAt: cursor.updatedAt,
            id: { lt: cursor.id },
          },
        ],
      }),
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
    take: safeLimit + 1,
  });

  const memoryIds = memoryList.map((memory) => memory.id);

  const memoryTags = await prisma.memoryTag.findMany({
    where: {
      memoryId: {
        in: memoryIds,
      },
    },
    include: {
      tag: true,
    },
  });

  const tagMap: Record<string, string[]> = {};

  for (const mt of memoryTags) {
    if (!tagMap[mt.memoryId]) {
      tagMap[mt.memoryId] = [];
    }
    tagMap[mt.memoryId]?.push(mt.tag.name);
  }

  let nextCursor = null;

  if (memoryList.length > safeLimit) {
    const nextItem = memoryList.pop();
    nextCursor = {
      isPinned: nextItem!.isPinned,
      updatedAt: nextItem!.updatedAt,
      id: nextItem!.id,
    };
  }

  const items = memoryList.map((memory) => ({
    id: memory.id,
    type: memory.type,
    title: memory.title,
    isPinned: memory.isPinned,
    updatedAt: memory.updatedAt,
    tags: tagMap[memory.id] ?? [],
  }));

  return {
    items,
    nextCursor,
  };
}

export async function suggestTags(title: string, content?: string) {
  const prompt = `
    Generate 5 concise tags for the following note.

    Rules:
    - lowercase
    - 1-2 words max
    - no punctuation
    - maximum 5 tags
    - return JSON array only

    Title: ${title}

    Content:
    ${content !== undefined && content.slice(0, 1500)}
  `;
  const result = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return normalizeTags(JSON.parse(result.text ?? "[]"));
}
