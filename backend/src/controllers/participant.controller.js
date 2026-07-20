import asyncHandler from "../utils/asyncHandler.js";

import {
  addParticipantToBooth,
  getParticipantDetails,
  getBoothParticipants,
  completeParticipantSession,
  changeParticipantName,
} from "../services/participant.service.js";

/**
 * POST /api/participants
 * Add a creator or recipient to a booth.
 */
export const createParticipant = asyncHandler(
  async (req, res) => {
    const participant = await addParticipantToBooth({
      boothId: req.body.boothId,
      userId: req.body.userId || null,
      role: req.body.role,
      displayName: req.body.displayName,
    });

    res.status(201).json({
      success: true,
      message: "Participant created successfully",
      data: participant,
    });
  }
);

/**
 * GET /api/participants/:participantId
 * Get one participant.
 */
export const getParticipantById = asyncHandler(
  async (req, res) => {
    const participant = await getParticipantDetails(
      req.params.participantId
    );

    res.status(200).json({
      success: true,
      data: participant,
    });
  }
);

/**
 * GET /api/participants/booth/:boothId
 * Get all participants belonging to a booth.
 */
export const getParticipantsByBooth = asyncHandler(
  async (req, res) => {
    const participants = await getBoothParticipants(
      req.params.boothId
    );

    res.status(200).json({
      success: true,
      count: participants.length,
      data: participants,
    });
  }
);

/**
 * PATCH /api/participants/:participantId/complete
 * Mark a participant's photo session as completed.
 */
export const markParticipantCompleted = asyncHandler(
  async (req, res) => {
    const participant =
      await completeParticipantSession(
        req.params.participantId
      );

    res.status(200).json({
      success: true,
      message: "Participant session completed",
      data: participant,
    });
  }
);

/**
 * PATCH /api/participants/:participantId/name
 * Change the participant display name.
 */
export const updateParticipantName = asyncHandler(
  async (req, res) => {
    const participant = await changeParticipantName(
      req.params.participantId,
      req.body.displayName
    );

    res.status(200).json({
      success: true,
      message: "Participant name updated",
      data: participant,
    });
  }
);