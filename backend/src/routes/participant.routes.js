import express from "express";

import {
  createParticipant,
  getParticipantById,
  getParticipantsByBooth,
  markParticipantCompleted,
  updateParticipantName,
} from "../controllers/participant.controller.js";

const router = express.Router();

router.post("/", createParticipant);

router.get(
  "/booth/:boothId",
  getParticipantsByBooth
);

router.get(
  "/:participantId",
  getParticipantById
);

router.patch(
  "/:participantId/complete",
  markParticipantCompleted
);

router.patch(
  "/:participantId/name",
  updateParticipantName
);

export default router;