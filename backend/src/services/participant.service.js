import {
  createParticipant,
  findParticipantById,
  findParticipantByBoothAndRole,
  findParticipantsByBoothId,
  markParticipantCompleted,
  updateParticipantName,
} from "../models/participant.model.js";

import {
  findBoothById,
  updateBoothStatus,
} from "../models/booth.model.js";

import {
  countPhotosByParticipantId,
} from "../models/photo.model.js";

import AppError from "../utils/AppError.js";

const ALLOWED_ROLES = [
  "creator",
  "recipient",
];

export const addParticipantToBooth = async ({
  boothId,
  userId = null,
  role,
  displayName,
}) => {
  if (!boothId) {
    throw new AppError(
      "Booth ID is required",
      400
    );
  }

  if (!displayName?.trim()) {
    throw new AppError(
      "Participant display name is required",
      400
    );
  }

  const normalizedRole = role
    ?.trim()
    .toLowerCase();

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    throw new AppError(
      "Role must be creator or recipient",
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

  if (
    booth.status === "COMPLETED" ||
    booth.status === "EXPIRED"
  ) {
    throw new AppError(
      "Participants cannot be added to this booth",
      400
    );
  }

  const existingParticipant =
    await findParticipantByBoothAndRole(
      boothId,
      normalizedRole
    );

  if (existingParticipant) {
    throw new AppError(
      `A ${normalizedRole} already exists for this booth`,
      409
    );
  }

  return createParticipant({
    boothId,
    userId,
    role: normalizedRole,
    displayName: displayName.trim(),
  });
};

export const getParticipantDetails = async (
  participantId
) => {
  const participant =
    await findParticipantById(
      participantId
    );

  if (!participant) {
    throw new AppError(
      "Participant not found",
      404
    );
  }

  return participant;
};

export const getBoothParticipants = async (
  boothId
) => {
  const booth = await findBoothById(boothId);

  if (!booth) {
    throw new AppError(
      "Photo booth not found",
      404
    );
  }

  return findParticipantsByBoothId(boothId);
};

export const completeParticipantSession =
  async (participantId) => {
    const participant =
      await findParticipantById(
        participantId
      );

    if (!participant) {
      throw new AppError(
        "Participant not found",
        404
      );
    }

    if (participant.completed) {
      throw new AppError(
        "Participant session is already completed",
        400
      );
    }

    const booth = await findBoothById(
      participant.booth_id
    );

    if (!booth) {
      throw new AppError(
        "Photo booth not found",
        404
      );
    }

    const photoCount =
      await countPhotosByParticipantId(
        participantId
      );

    if (photoCount !== booth.photo_count) {
      throw new AppError(
        `Participant must upload exactly ${booth.photo_count} photos before completing`,
        400
      );
    }

    const completedParticipant =
      await markParticipantCompleted(
        participantId
      );

    const participants =
      await findParticipantsByBoothId(
        participant.booth_id
      );

    const creator = participants.find(
      (item) => item.role === "creator"
    );

    const recipient = participants.find(
      (item) => item.role === "recipient"
    );

    let nextStatus = booth.status;

    if (
      creator?.completed &&
      recipient?.completed
    ) {
      nextStatus = "RECIPIENT_DONE";
    } else if (creator?.completed) {
      nextStatus = "CREATOR_DONE";
    }

    if (nextStatus !== booth.status) {
      await updateBoothStatus(
        participant.booth_id,
        nextStatus
      );
    }

    return completedParticipant;
  };

export const changeParticipantName = async (
  participantId,
  displayName
) => {
  if (!displayName?.trim()) {
    throw new AppError(
      "Display name is required",
      400
    );
  }

  const participant =
    await findParticipantById(
      participantId
    );

  if (!participant) {
    throw new AppError(
      "Participant not found",
      404
    );
  }

  return updateParticipantName(
    participantId,
    displayName.trim()
  );
};