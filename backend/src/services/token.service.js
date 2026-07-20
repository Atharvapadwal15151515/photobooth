import {
  generateInviteToken,
  hashInviteToken,
} from "../utils/generateInviteToken.js";

export const createInviteToken = () => {
  const rawToken = generateInviteToken();

  return {
    rawToken,
    hashedToken: hashInviteToken(rawToken),
  };
};

export const getInviteTokenHash = (token) => {
  return hashInviteToken(token);
};