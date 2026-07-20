import express from "express";

import {
  generateCard,
  getCardByBooth,
  regenerateCard,
  deleteCard,
} from "../controllers/card.controller.js";

const router = express.Router();

router.post(
  "/generate/:boothId",
  generateCard
);

router.get(
  "/booth/:boothId",
  getCardByBooth
);

router.put(
  "/regenerate/:boothId",
  regenerateCard
);

router.delete(
  "/booth/:boothId",
  deleteCard
);

export default router;