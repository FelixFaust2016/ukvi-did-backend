import crypto from "crypto";

export const crypto_random_pass_key = (): string => {
  const random_pass = crypto.randomBytes(16).toString("hex");

  return random_pass;
};
