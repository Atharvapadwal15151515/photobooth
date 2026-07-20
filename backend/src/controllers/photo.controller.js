import asyncHandler from "../utils/asyncHandler.js";

import {
  saveParticipantPhoto,
  getParticipantPhotos,
  getBoothPhotos,
  replaceParticipantPhoto,
  removeParticipantPhoto,
} from "../services/photo.service.js";

/**
 * POST /api/photos
 *
 * multipart/form-data:
 * image
 * boothId
 * participantId
 * photoNumber
 */
export const uploadPhoto = asyncHandler(
  async (req, res) => {
    const photo = await saveParticipantPhoto({
      boothId: req.body.boothId,
      participantId: req.body.participantId,
      photoNumber: Number(req.body.photoNumber),
      file: req.file,
    });

    res.status(201).json({
      success: true,
      message: "Photo uploaded successfully",
      data: photo,
    });
  }
);

/**
 * GET /api/photos/participant/:participantId
 * Get all photos captured by one participant.
 */
export const getPhotosByParticipant = asyncHandler(
  async (req, res) => {
    const photos = await getParticipantPhotos(
      req.params.participantId
    );

    res.status(200).json({
      success: true,
      count: photos.length,
      data: photos,
    });
  }
);

/**
 * GET /api/photos/booth/:boothId
 * Get all photos belonging to a booth.
 */
export const getPhotosByBooth = asyncHandler(
  async (req, res) => {
    const photos = await getBoothPhotos(
      req.params.boothId
    );

    res.status(200).json({
      success: true,
      count: photos.length,
      data: photos,
    });
  }
);

/**
 * PUT /api/photos/:photoId
 *
 * multipart/form-data:
 * image
 */
export const replacePhoto = asyncHandler(
  async (req, res) => {
    const photo = await replaceParticipantPhoto({
      photoId: req.params.photoId,
      file: req.file,
    });

    res.status(200).json({
      success: true,
      message: "Photo replaced successfully",
      data: photo,
    });
  }
);

/**
 * DELETE /api/photos/:photoId
 * Delete a photo from PostgreSQL and Cloudinary.
 */
export const deletePhoto = asyncHandler(
  async (req, res) => {
    await removeParticipantPhoto(
      req.params.photoId
    );

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully",
    });
  }
);