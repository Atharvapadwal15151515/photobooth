import express from "express";

import upload from "../middleware/upload.middleware.js";

import {
  uploadPhoto,
  getPhotosByParticipant,
  getPhotosByBooth,
  replacePhoto,
  deletePhoto,
} from "../controllers/photo.controller.js";

const router = express.Router();

router.post(
  "/",
  upload.single("image"),
  uploadPhoto
);

router.get(
  "/participant/:participantId",
  getPhotosByParticipant
);

router.get(
  "/booth/:boothId",
  getPhotosByBooth
);

router.put(
  "/:photoId",
  upload.single("image"),
  replacePhoto
);

router.delete("/:photoId", deletePhoto);

export default router;