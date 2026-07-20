import {
  createBooth,
  findBoothById,
  findBoothByInviteToken,
  updateBooth,
  deleteBooth,
} from "../models/booth.model.js";

import {
  createParticipant,
  findParticipantsByBoothId,
} from "../models/participant.model.js";

import {
  findPhotosByBoothId,
} from "../models/photo.model.js";

import {
  findCardByBoothId,
} from "../models/card.model.js";

import {
  generateInviteToken,
} from "../utils/generateInviteToken.js";

import AppError from "../utils/AppError.js";

const ALLOWED_THEMES = [
  "classic",
  "birthday",
  "cute",
  "minimal",
  "romantic",
  "retro",
];

export const createNewBooth = async ({
  creatorUserId = null,
  creatorName,
  recipientName,
  title = null,
  message = null,
  theme = "classic",
  photoCount = 4,
  expiresAt = null,
}) => {
  if (!creatorName?.trim()) {
    throw new AppError(
      "Creator name is required",
      400
    );
  }

  if (!recipientName?.trim()) {
    throw new AppError(
      "Recipient name is required",
      400
    );
  }

  const normalizedPhotoCount = Number(photoCount);

  if (
    !Number.isInteger(normalizedPhotoCount) ||
    normalizedPhotoCount < 1 ||
    normalizedPhotoCount > 8
  ) {
    throw new AppError(
      "Photo count must be between 1 and 8",
      400
    );
  }

  const normalizedTheme = theme
    ?.trim()
    .toLowerCase();

  if (!ALLOWED_THEMES.includes(normalizedTheme)) {
    throw new AppError(
      `Theme must be one of: ${ALLOWED_THEMES.join(", ")}`,
      400
    );
  }

  let normalizedExpiry = expiresAt;

  if (!normalizedExpiry) {
    normalizedExpiry = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );
  } else {
    normalizedExpiry = new Date(normalizedExpiry);

    if (Number.isNaN(normalizedExpiry.getTime())) {
      throw new AppError(
        "Invalid booth expiry date",
        400
      );
    }

    if (normalizedExpiry <= new Date()) {
      throw new AppError(
        "Expiry date must be in the future",
        400
      );
    }
  }

  const inviteToken = generateInviteToken();

  const booth = await createBooth({
    creatorUserId,
    creatorName: creatorName.trim(),
    recipientName: recipientName.trim(),
    title: title?.trim() || null,
    message: message?.trim() || null,
    theme: normalizedTheme,
    photoCount: normalizedPhotoCount,
    inviteToken,
    expiresAt: normalizedExpiry,
  });

  const creatorParticipant =
    await createParticipant({
      boothId: booth.booth_id,
      userId: creatorUserId,
      role: "creator",
      displayName: creatorName.trim(),
    });

  const recipientParticipant =
    await createParticipant({
      boothId: booth.booth_id,
      userId: null,
      role: "recipient",
      displayName: recipientName.trim(),
    });

  return {
    booth,
    participants: {
      creator: creatorParticipant,
      recipient: recipientParticipant,
    },
    inviteToken,
    invitePath: `/invite/${inviteToken}`,
  };
};

export const getBoothDetails = async (
  boothId
) => {
  if (!boothId) {
    throw new AppError(
      "Booth ID is required",
      400
    );
  }

  const booth = await findBoothById(boothId);

  if (!booth) {
    throw new AppError(
      "Photo booth not found",
      404
    );
  }

  const [
    participants,
    photos,
    generatedCard,
  ] = await Promise.all([
    findParticipantsByBoothId(boothId),
    findPhotosByBoothId(boothId),
    findCardByBoothId(boothId),
  ]);

  return {
    ...booth,
    participants,
    photos,
    generatedCard,
  };
};

export const getBoothUsingInviteToken =
  async (inviteToken) => {
    if (!inviteToken?.trim()) {
      throw new AppError(
        "Invitation token is required",
        400
      );
    }

    const booth = await findBoothByInviteToken(
      inviteToken.trim()
    );

    if (!booth) {
      throw new AppError(
        "Invalid invitation link",
        404
      );
    }

    if (
      booth.expires_at &&
      new Date(booth.expires_at) < new Date()
    ) {
      throw new AppError(
        "This invitation link has expired",
        410
      );
    }

    if (booth.status === "EXPIRED") {
      throw new AppError(
        "This photo booth has expired",
        410
      );
    }

    const participants =
      await findParticipantsByBoothId(
        booth.booth_id
      );

    return {
      ...booth,
      participants,
    };
  };

export const updateExistingBooth = async (
  boothId,
  updates
) => {
  const existingBooth =
    await findBoothById(boothId);

  if (!existingBooth) {
    throw new AppError(
      "Photo booth not found",
      404
    );
  }

  if (
    ["GENERATING", "COMPLETED", "EXPIRED"].includes(
      existingBooth.status
    )
  ) {
    throw new AppError(
      "This photo booth can no longer be edited",
      400
    );
  }

  if (
    updates.photoCount !== undefined &&
    updates.photoCount !== null
  ) {
    const photoCount = Number(
      updates.photoCount
    );

    if (
      !Number.isInteger(photoCount) ||
      photoCount < 1 ||
      photoCount > 8
    ) {
      throw new AppError(
        "Photo count must be between 1 and 8",
        400
      );
    }

    updates.photoCount = photoCount;
  }

  if (updates.theme) {
    const theme = updates.theme
      .trim()
      .toLowerCase();

    if (!ALLOWED_THEMES.includes(theme)) {
      throw new AppError(
        `Theme must be one of: ${ALLOWED_THEMES.join(", ")}`,
        400
      );
    }

    updates.theme = theme;
  }

  if (updates.expiresAt) {
    const expiresAt = new Date(
      updates.expiresAt
    );

    if (Number.isNaN(expiresAt.getTime())) {
      throw new AppError(
        "Invalid expiry date",
        400
      );
    }

    if (expiresAt <= new Date()) {
      throw new AppError(
        "Expiry date must be in the future",
        400
      );
    }

    updates.expiresAt = expiresAt;
  }

  const updatedBooth = await updateBooth(
    boothId,
    updates
  );

  return updatedBooth;
};

export const removeBooth = async (
  boothId
) => {
  const booth = await findBoothById(boothId);

  if (!booth) {
    throw new AppError(
      "Photo booth not found",
      404
    );
  }

  await deleteBooth(boothId);

  return true;
};