import bcrypt from "bcrypt";

export const hashPassword = async (password: string): Promise<string> => {
  if (!password) {
    throw new Error("A valid password is required");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return hashedPassword;
};

export const verifyPassword = async (
  plainPassword: string,
  passwordHash: string
): Promise<boolean> => {
  if (!plainPassword || !passwordHash) {
    return false;
  }

  return bcrypt.compare(plainPassword, passwordHash);
};
