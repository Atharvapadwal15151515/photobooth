import crypto from "crypto";

export const generateInviteToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashInviteToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};