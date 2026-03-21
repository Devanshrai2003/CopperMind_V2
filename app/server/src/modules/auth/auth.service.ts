import { prisma } from "../../lib/prisma.js";
import { addDays } from "date-fns";
import { hashPassword, verifyPassword } from "./auth.utils.js";
import type { GitHubEmail, GitHubUser, GoogleUser } from "./auth.types.js";
import { github, google } from "../../lib/arctic.js";
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
  currentUserId?: string,
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

export async function handleOauthUser(
  params: {
    provider: "google" | "github";
    providerId: string;
    email: string;
  },
  currentUserId?: string,
) {
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerId: {
        provider: params.provider,
        providerId: params.providerId,
      },
    },
    include: {
      user: true,
    },
  });

  if (existingAccount) {
    const session = await createSession(existingAccount.user.id);
    return { user: existingAccount.user, session };
  }

  if (currentUserId) {
    const user = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        email: params.email,
        isGuest: false,
        guestExpiresAt: null,
        accounts: {
          create: {
            provider: params.provider,
            providerId: params.providerId,
          },
        },
      },
    });

    const session = await createSession(user.id);
    return { user, session };
  }

  if (params.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: params.email },
    });

    if (existingUser) {
      const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: existingUser.emailVerified || new Date(),
          accounts: {
            create: {
              provider: params.provider,
              providerId: params.providerId,
            },
          },
        },
      });

      const session = await createSession(user.id);
      return { user, session };
    }
  }
  const user = await prisma.user.create({
    data: {
      email: params.email,
      isGuest: false,
      emailVerified: new Date(),
      accounts: {
        create: {
          provider: params.provider,
          providerId: params.providerId,
        },
      },
    },
  });

  const session = await createSession(user.id);
  return { user, session };
}

export async function verifyGoogleCode(code: string, codeVerifier: string) {
  const tokens = await google.validateAuthorizationCode(code, codeVerifier);

  const userRes = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    },
  );
  const userData = (await userRes.json()) as GoogleUser;

  return {
    id: userData.sub, // Google uses 'sub' for the unique ID
    email: userData.email,
    username: userData.name,
  };
}

export async function verifyGitHubCode(code: string) {
  const tokens = await github.validateAuthorizationCode(code);

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });

  const userData = (await userRes.json()) as GitHubUser;

  const emailsRes = await fetch("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });

  const emailsData = (await emailsRes.json()) as GitHubEmail[];

  const primaryEmail = emailsData.find((e) => e.primary)?.email;

  return {
    id: userData.id.toString(),
    email: primaryEmail,
    username: userData.login,
  };
}
