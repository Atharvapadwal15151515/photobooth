import cloudinary from "../config/cloudinary.js";

import {
  createPhoto,
  findPhotoById,
  findPhotosByParticipantId,
  findPhotosByBoothId,
  countPhotosByParticipantId,
  replacePhoto,
  deletePhoto,
} from "../models/photo.model.js";

import {
  findParticipantById,
} from "../models/participant.model.js";

import {
  findBoothById,
} from "../models/booth.model.js";

import AppError from "../utils/AppError.js";

const deleteCloudinaryImage = async (
  publicId
) => {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
      }
    );
  } catch (error) {
    console.error(
      "Cloudinary deletion failed:",
      error.message
    );
  }
};

const getCloudinaryFileInformation = (
  file
) => {
  if (!file) {
    throw new AppError(
      "Image file is required",
      400
    );
  }

  const imageUrl =
    file.path ||
    file.secure_url ||
    file.url;

  const cloudinaryPublicId =
    file.filename ||
    file.public_id;

  if (!imageUrl || !cloudinaryPublicId) {
    throw new AppError(
      "Cloudinary upload information is missing",
      500
    );
  }

  return {
    imageUrl,
    cloudinaryPublicId,
  };
};

export const saveParticipantPhoto = async ({
  boothId,
  participantId,
  photoNumber,
  file,
}) => {
  const {
    imageUrl,
    cloudinaryPublicId,
  } = getCloudinaryFileInformation(file);

  try {
    if (!boothId || !participantId) {
      throw new AppError(
        "Booth ID and participant ID are required",
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

    if (participant.booth_id !== boothId) {
      throw new AppError(
        "Participant does not belong to this booth",
        400
      );
    }

    if (participant.completed) {
      throw new AppError(
        "Completed participants cannot upload more photos",
        400
      );
    }

    const booth = await findBoothById(
      boothId
    );

    if (!booth) {
      throw new AppError(
        "Photo booth not found",
        404
      );
    }

    if (
      ["GENERATING", "COMPLETED", "EXPIRED"].includes(
        booth.status
      )
    ) {
      throw new AppError(
        "Photos cannot be uploaded to this booth",
        400
      );
    }

    if (
      !Number.isInteger(photoNumber) ||
      photoNumber < 1 ||
      photoNumber > booth.photo_count
    ) {
      throw new AppError(
        `Photo number must be between 1 and ${booth.photo_count}`,
        400
      );
    }

    const existingPhotos =
      await findPhotosByParticipantId(
        participantId
      );

    const duplicatePhoto =
      existingPhotos.find(
        (photo) =>
          photo.photo_number ===
          photoNumber
      );

    if (duplicatePhoto) {
      throw new AppError(
        `Photo number ${photoNumber} already exists. Use the replace endpoint instead.`,
        409
      );
    }

    const uploadedPhotoCount =
      await countPhotosByParticipantId(
        participantId
      );

    if (
      uploadedPhotoCount >=
      booth.photo_count
    ) {
      throw new AppError(
        "The required number of photos has already been uploaded",
        400
      );
    }

    return await createPhoto({
      boothId,
      participantId,
      photoNumber,
      imageUrl,
      cloudinaryPublicId,
    });
  } catch (error) {
    await deleteCloudinaryImage(
      cloudinaryPublicId
    );

    throw error;
  }
};

export const getParticipantPhotos = async (
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

  return findPhotosByParticipantId(
    participantId
  );
};

export const getBoothPhotos = async (
  boothId
) => {
  const booth = await findBoothById(boothId);

  if (!booth) {
    throw new AppError(
      "Photo booth not found",
      404
    );
  }

  return findPhotosByBoothId(boothId);
};

export const replaceParticipantPhoto =
  async ({ photoId, file }) => {
    const {
      imageUrl,
      cloudinaryPublicId,
    } = getCloudinaryFileInformation(file);

    const existingPhoto =
      await findPhotoById(photoId);

    if (!existingPhoto) {
      await deleteCloudinaryImage(
        cloudinaryPublicId
      );

      throw new AppError(
        "Photo not found",
        404
      );
    }

    try {
      const updatedPhoto =
        await replacePhoto(
          existingPhoto.participant_id,
          existingPhoto.photo_number,
          {
            imageUrl,
            cloudinaryPublicId,
          }
        );

      if (!updatedPhoto) {
        throw new AppError(
          "Photo could not be replaced",
          500
        );
      }

      await deleteCloudinaryImage(
        existingPhoto.cloudinary_public_id
      );

      return updatedPhoto;
    } catch (error) {
      await deleteCloudinaryImage(
        cloudinaryPublicId
      );

      throw error;
    }
  };

export const removeParticipantPhoto = async (
  photoId
) => {
  const photo = await findPhotoById(photoId);

  if (!photo) {
    throw new AppError(
      "Photo not found",
      404
    );
  }

  const participant =
    await findParticipantById(
      photo.participant_id
    );

  if (participant?.completed) {
    throw new AppError(
      "Photos cannot be deleted after completing the session",
      400
    );
  }

  const deletedPhoto =
    await deletePhoto(photoId);

  await deleteCloudinaryImage(
    photo.cloudinary_public_id
  );

  return deletedPhoto;
};