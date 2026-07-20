import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";

import {
  findBoothById,
  updateBoothStatus,
} from "../models/booth.model.js";

import {
  findParticipantsByBoothId,
} from "../models/participant.model.js";

import {
  findPhotosByBoothId,
} from "../models/photo.model.js";

import {
  findCardByBoothId,
  upsertGeneratedCard,
  deleteCardByBoothId,
} from "../models/card.model.js";

import AppError from "../utils/AppError.js";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1080;

const escapeXml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const downloadImage = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new AppError(
      "Could not download one of the booth photos",
      502
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
};

const uploadBufferToCloudinary = (
  buffer,
  boothId
) => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder:
            "photo-booth-app/generated-cards",
          public_id: `booth-${boothId}`,
          overwrite: true,
          resource_type: "image",
          format: "png",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        }
      );

    uploadStream.end(buffer);
  });
};

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
      "Cloudinary card deletion failed:",
      error.message
    );
  }
};

const getThemeBackground = (theme) => {
  const backgrounds = {
    classic: "#fff7ed",
    birthday: "#fdf2f8",
    cute: "#fef2f2",
    minimal: "#f8fafc",
    romantic: "#fff1f2",
    retro: "#fef3c7",
  };

  return backgrounds[theme] || backgrounds.classic;
};

const getThemeAccent = (theme) => {
  const accents = {
    classic: "#7c2d12",
    birthday: "#be185d",
    cute: "#e11d48",
    minimal: "#334155",
    romantic: "#be123c",
    retro: "#92400e",
  };

  return accents[theme] || accents.classic;
};

const createCardBuffer = async ({
  booth,
  creatorPhotos,
  recipientPhotos,
}) => {
  const background =
    getThemeBackground(booth.theme);

  const accent =
    getThemeAccent(booth.theme);

  const allPhotos = [];

  const numberOfPairs = booth.photo_count;

  for (
    let index = 0;
    index < numberOfPairs;
    index += 1
  ) {
    allPhotos.push(creatorPhotos[index]);
    allPhotos.push(recipientPhotos[index]);
  }

  const columns = 4;
  const rows = Math.ceil(
    allPhotos.length / columns
  );

  const photoWidth = 225;
  const photoHeight = 190;
  const horizontalGap = 20;
  const verticalGap = 20;

  const gridWidth =
    columns * photoWidth +
    (columns - 1) * horizontalGap;

  const gridStartX =
    (CARD_WIDTH - gridWidth) / 2;

  const gridStartY = 220;

  const maximumGridHeight = 650;

  const calculatedGridHeight =
    rows * photoHeight +
    (rows - 1) * verticalGap;

  const scaleFactor =
    calculatedGridHeight >
    maximumGridHeight
      ? maximumGridHeight /
        calculatedGridHeight
      : 1;

  const finalPhotoWidth = Math.floor(
    photoWidth * scaleFactor
  );

  const finalPhotoHeight = Math.floor(
    photoHeight * scaleFactor
  );

  const finalHorizontalGap = Math.floor(
    horizontalGap * scaleFactor
  );

  const finalVerticalGap = Math.floor(
    verticalGap * scaleFactor
  );

  const finalGridWidth =
    columns * finalPhotoWidth +
    (columns - 1) * finalHorizontalGap;

  const finalGridStartX =
    (CARD_WIDTH - finalGridWidth) / 2;

  const composites = [];

  for (
    let index = 0;
    index < allPhotos.length;
    index += 1
  ) {
    const photo = allPhotos[index];

    const imageBuffer = await downloadImage(
      photo.image_url
    );

    const resizedPhoto = await sharp(
      imageBuffer
    )
      .rotate()
      .resize(
        finalPhotoWidth,
        finalPhotoHeight,
        {
          fit: "cover",
          position: "centre",
        }
      )
      .png()
      .toBuffer();

    const column = index % columns;
    const row = Math.floor(index / columns);

    composites.push({
      input: resizedPhoto,
      left: Math.round(
        finalGridStartX +
          column *
            (finalPhotoWidth +
              finalHorizontalGap)
      ),
      top: Math.round(
        gridStartY +
          row *
            (finalPhotoHeight +
              finalVerticalGap)
      ),
    });
  }

  const heading =
    booth.title ||
    `Happy Birthday, ${booth.recipient_name}!`;

  const message =
    booth.message ||
    `With love from ${booth.creator_name}`;

  const overlaySvg = `
    <svg
      width="${CARD_WIDTH}"
      height="${CARD_HEIGHT}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="35"
        y="35"
        width="1010"
        height="1010"
        rx="45"
        fill="none"
        stroke="${accent}"
        stroke-width="6"
      />

      <text
        x="540"
        y="105"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="54"
        font-weight="700"
        fill="${accent}"
      >
        ${escapeXml(heading)}
      </text>

      <text
        x="540"
        y="165"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="25"
        fill="${accent}"
      >
        ${escapeXml(
          `${booth.creator_name} + ${booth.recipient_name}`
        )}
      </text>

      <text
        x="540"
        y="1010"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="25"
        fill="${accent}"
      >
        ${escapeXml(message)}
      </text>
    </svg>
  `;

  return sharp({
    create: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      channels: 4,
      background,
    },
  })
    .composite([
      ...composites,
      {
        input: Buffer.from(overlaySvg),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();
};

const validateBoothForGeneration = async (
  boothId
) => {
  const booth = await findBoothById(boothId);

  if (!booth) {
    throw new AppError(
      "Photo booth not found",
      404
    );
  }

  if (booth.status === "EXPIRED") {
    throw new AppError(
      "Expired booths cannot generate cards",
      400
    );
  }

  const participants =
    await findParticipantsByBoothId(boothId);

  const creator = participants.find(
    (participant) =>
      participant.role === "creator"
  );

  const recipient = participants.find(
    (participant) =>
      participant.role === "recipient"
  );

  if (!creator || !recipient) {
    throw new AppError(
      "Creator and recipient are required",
      400
    );
  }

  if (
    !creator.completed ||
    !recipient.completed
  ) {
    throw new AppError(
      "Both participants must complete their photo sessions",
      400
    );
  }

  const photos =
    await findPhotosByBoothId(boothId);

  const creatorPhotos = photos.filter(
    (photo) => photo.role === "creator"
  );

  const recipientPhotos = photos.filter(
    (photo) => photo.role === "recipient"
  );

  if (
    creatorPhotos.length !==
      booth.photo_count ||
    recipientPhotos.length !==
      booth.photo_count
  ) {
    throw new AppError(
      `Both participants must have exactly ${booth.photo_count} photos`,
      400
    );
  }

  return {
    booth,
    creatorPhotos,
    recipientPhotos,
  };
};

export const generateBoothCard = async (
  boothId
) => {
  const existingCard =
    await findCardByBoothId(boothId);

  if (existingCard) {
    throw new AppError(
      "A generated card already exists. Use the regenerate endpoint.",
      409
    );
  }

  const {
    booth,
    creatorPhotos,
    recipientPhotos,
  } = await validateBoothForGeneration(
    boothId
  );

  await updateBoothStatus(
    boothId,
    "GENERATING"
  );

  try {
    const cardBuffer =
      await createCardBuffer({
        booth,
        creatorPhotos,
        recipientPhotos,
      });

    const cloudinaryResult =
      await uploadBufferToCloudinary(
        cardBuffer,
        boothId
      );

    const card = await upsertGeneratedCard({
      boothId,
      finalImageUrl:
        cloudinaryResult.secure_url,
      cloudinaryPublicId:
        cloudinaryResult.public_id,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });

    await updateBoothStatus(
      boothId,
      "COMPLETED"
    );

    return card;
  } catch (error) {
    await updateBoothStatus(
      boothId,
      "RECIPIENT_DONE"
    );

    throw new AppError(
      `Card generation failed: ${error.message}`,
      500
    );
  }
};

export const getBoothGeneratedCard =
  async (boothId) => {
    const booth = await findBoothById(
      boothId
    );

    if (!booth) {
      throw new AppError(
        "Photo booth not found",
        404
      );
    }

    const card = await findCardByBoothId(
      boothId
    );

    if (!card) {
      throw new AppError(
        "Generated card not found",
        404
      );
    }

    return card;
  };

export const regenerateBoothCard = async (
  boothId
) => {
  const {
    booth,
    creatorPhotos,
    recipientPhotos,
  } = await validateBoothForGeneration(
    boothId
  );

  const existingCard =
    await findCardByBoothId(boothId);

  await updateBoothStatus(
    boothId,
    "GENERATING"
  );

  try {
    const cardBuffer =
      await createCardBuffer({
        booth,
        creatorPhotos,
        recipientPhotos,
      });

    const cloudinaryResult =
      await uploadBufferToCloudinary(
        cardBuffer,
        boothId
      );

    const card = await upsertGeneratedCard({
      boothId,
      finalImageUrl:
        cloudinaryResult.secure_url,
      cloudinaryPublicId:
        cloudinaryResult.public_id,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });

    if (
      existingCard?.cloudinary_public_id &&
      existingCard.cloudinary_public_id !==
        cloudinaryResult.public_id
    ) {
      await deleteCloudinaryImage(
        existingCard.cloudinary_public_id
      );
    }

    await updateBoothStatus(
      boothId,
      "COMPLETED"
    );

    return card;
  } catch (error) {
    await updateBoothStatus(
      boothId,
      "RECIPIENT_DONE"
    );

    throw new AppError(
      `Card regeneration failed: ${error.message}`,
      500
    );
  }
};

export const removeGeneratedCard = async (
  boothId
) => {
  const card = await findCardByBoothId(
    boothId
  );

  if (!card) {
    throw new AppError(
      "Generated card not found",
      404
    );
  }

  await deleteCardByBoothId(boothId);

  await deleteCloudinaryImage(
    card.cloudinary_public_id
  );

  await updateBoothStatus(
    boothId,
    "RECIPIENT_DONE"
  );

  return true;
};