import { prisma } from "../../lib/prisma.js";
import { addDays } from "date-fns";
import { hashPassword, verifyPassword } from "./auth.utils.js";

const SESSION_DURATION_DAYS = 7;

export async function createSession(userId: string) {
  const expiresAt = addDays(new Date(), SESSION_DURATION_DAYS);

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  return session;
}

export async function createGuestUser() {
  const user = await prisma.user.create({
    data: {
      isGuest: true,
    },
  });

  const session = await createSession(user.id);

  return { user, session };
}

export async function signupWithCredentials(
  params: {
    email: string;
    password: string;
  },
  currentUserId?: string
) {
  const passwordHash = await hashPassword(params.password);

  if (currentUserId) {
    const user = await prisma.user.update({
      where: {
        id: currentUserId,
      },
      data: {
        email: params.email,
        passwordHash,
        isGuest: false,
      },
    });

    const session = await createSession(user.id);
    return { user, session };
  }

  const user = await prisma.user.create({
    data: {
      email: params.email,
      passwordHash,
      isGuest: false,
    },
  });

  const session = await createSession(user.id);
  return { user, session };
}

export async function loginWithCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Invalid credentials");
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const session = await createSession(user.id);
  return { user, session };
}
