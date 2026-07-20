import express from "express";

import {
  createBooth,
  getBoothById,
  getBoothByInviteToken,
  updateBooth,
  deleteBooth,
} from "../controllers/booth.controller.js";

const router = express.Router();

router.post("/", createBooth);

router.get(
  "/invite/:inviteToken",
  getBoothByInviteToken
);

router.get("/:boothId", getBoothById);

router.patch("/:boothId", updateBooth);

router.delete("/:boothId", deleteBooth);

export default router;