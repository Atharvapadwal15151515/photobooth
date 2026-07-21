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

const CARD_WIDTH = 900;
const CARD_HEIGHT = 1800;

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
const createRoundedPhoto = async (
  imageBuffer,
  width,
  height,
  radius = 28
) => {
  const roundedMask = Buffer.from(`
    <svg
      width="${width}"
      height="${height}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0"
        y="0"
        width="${width}"
        height="${height}"
        rx="${radius}"
        ry="${radius}"
        fill="#ffffff"
      />
    </svg>
  `);

  return sharp(imageBuffer)
    .rotate()
    .resize(width, height, {
      fit: "cover",
      position: "centre",
    })
    .composite([
      {
        input: roundedMask,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();
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

  const sortedCreatorPhotos = [
    ...creatorPhotos,
  ].sort(
    (firstPhoto, secondPhoto) =>
      firstPhoto.photo_number -
      secondPhoto.photo_number
  );

  const sortedRecipientPhotos = [
    ...recipientPhotos,
  ].sort(
    (firstPhoto, secondPhoto) =>
      firstPhoto.photo_number -
      secondPhoto.photo_number
  );

  const photoWidth = 350;
  const photoHeight = 255;

  const leftMargin = 70;
  const columnGap = 60;

  const creatorPhotoX = leftMargin;

  const recipientPhotoX =
    creatorPhotoX +
    photoWidth +
    columnGap;

  const firstRowY = 335;
  const rowGap = 30;

  const photoRadius = 28;

  const creatorName =
    booth.creator_name || "Creator";

  const recipientName =
    booth.recipient_name || "Recipient";

  const heading =
    booth.title ||
    `Happy Birthday, ${recipientName}!`;

  const message =
    booth.message ||
    `With love from ${creatorName}`;

  const generatedDate =
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

  const truncateText = (
    value,
    maximumLength
  ) => {
    const text = String(value || "");

    if (text.length <= maximumLength) {
      return text;
    }

    return `${text.slice(
      0,
      maximumLength - 3
    )}...`;
  };

  const safeHeading = escapeXml(
    truncateText(heading, 40)
  );

  const safeMessage = escapeXml(
    truncateText(message, 65)
  );

  const safeCreatorName = escapeXml(
    truncateText(creatorName, 18)
  );

  const safeRecipientName = escapeXml(
    truncateText(recipientName, 18)
  );

  /*
  |--------------------------------------------------------------------------
  | Background decorations
  |--------------------------------------------------------------------------
  */

  const backgroundSvg = `
    <svg
      width="${CARD_WIDTH}"
      height="${CARD_HEIGHT}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="24"
        y="24"
        width="${CARD_WIDTH - 48}"
        height="${CARD_HEIGHT - 48}"
        rx="55"
        fill="none"
        stroke="${accent}"
        stroke-width="5"
      />

      <circle
        cx="82"
        cy="100"
        r="15"
        fill="${accent}"
        opacity="0.22"
      />

      <circle
        cx="820"
        cy="125"
        r="28"
        fill="${accent}"
        opacity="0.12"
      />

      <circle
        cx="105"
        cy="1680"
        r="34"
        fill="${accent}"
        opacity="0.12"
      />

      <circle
        cx="810"
        cy="1705"
        r="16"
        fill="${accent}"
        opacity="0.22"
      />

      <path
        d="M155 92 L164 113 L187 114 L169 128 L175 151 L155 138 L135 151 L141 128 L123 114 L146 113 Z"
        fill="${accent}"
        opacity="0.18"
      />

      <path
        d="M735 1615 L744 1636 L767 1637 L749 1651 L755 1674 L735 1661 L715 1674 L721 1651 L703 1637 L726 1636 Z"
        fill="${accent}"
        opacity="0.18"
      />

      ${Array.from({
        length: booth.photo_count,
      })
        .map((_, index) => {
          const top =
            firstRowY +
            index *
              (photoHeight + rowGap);

          return `
            <rect
              x="${creatorPhotoX - 9}"
              y="${top - 9}"
              width="${photoWidth + 18}"
              height="${photoHeight + 18}"
              rx="${photoRadius + 8}"
              fill="#000000"
              opacity="0.08"
            />

            <rect
              x="${recipientPhotoX - 9}"
              y="${top - 9}"
              width="${photoWidth + 18}"
              height="${photoHeight + 18}"
              rx="${photoRadius + 8}"
              fill="#000000"
              opacity="0.08"
            />
          `;
        })
        .join("")}
    </svg>
  `;

  /*
  |--------------------------------------------------------------------------
  | Prepare paired photos
  |--------------------------------------------------------------------------
  */

  const photoComposites = [];

  for (
    let index = 0;
    index < booth.photo_count;
    index += 1
  ) {
    const creatorPhoto =
      sortedCreatorPhotos[index];

    const recipientPhoto =
      sortedRecipientPhotos[index];

    if (!creatorPhoto || !recipientPhoto) {
      throw new AppError(
        `Photo pair ${index + 1} is incomplete`,
        400
      );
    }

    const [
      creatorImageBuffer,
      recipientImageBuffer,
    ] = await Promise.all([
      downloadImage(creatorPhoto.image_url),
      downloadImage(
        recipientPhoto.image_url
      ),
    ]);

    const [
      roundedCreatorPhoto,
      roundedRecipientPhoto,
    ] = await Promise.all([
      createRoundedPhoto(
        creatorImageBuffer,
        photoWidth,
        photoHeight,
        photoRadius
      ),
      createRoundedPhoto(
        recipientImageBuffer,
        photoWidth,
        photoHeight,
        photoRadius
      ),
    ]);

    const rowY =
      firstRowY +
      index * (photoHeight + rowGap);

    photoComposites.push({
      input: roundedCreatorPhoto,
      left: creatorPhotoX,
      top: rowY,
    });

    photoComposites.push({
      input: roundedRecipientPhoto,
      left: recipientPhotoX,
      top: rowY,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Text and footer
  |--------------------------------------------------------------------------
  */

  const textOverlaySvg = `
    <svg
      width="${CARD_WIDTH}"
      height="${CARD_HEIGHT}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="${CARD_WIDTH / 2}"
        y="118"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="22"
        font-weight="700"
        letter-spacing="6"
        fill="${accent}"
      >
        PHOTO BOOTH
      </text>

      <text
        x="${CARD_WIDTH / 2}"
        y="198"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="50"
        font-weight="700"
        fill="${accent}"
      >
        ${safeHeading}
      </text>

      <text
        x="${CARD_WIDTH / 2}"
        y="250"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="24"
        fill="${accent}"
        opacity="0.82"
      >
        ${safeCreatorName} + ${safeRecipientName}
      </text>

      <line
        x1="120"
        y1="282"
        x2="780"
        y2="282"
        stroke="${accent}"
        stroke-width="2"
        opacity="0.28"
      />

      <text
        x="${creatorPhotoX + photoWidth / 2}"
        y="320"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="21"
        font-weight="700"
        fill="${accent}"
      >
        ${safeCreatorName}
      </text>

      <text
        x="${recipientPhotoX + photoWidth / 2}"
        y="320"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="21"
        font-weight="700"
        fill="${accent}"
      >
        ${safeRecipientName}
      </text>

      ${Array.from({
        length: booth.photo_count,
      })
        .map((_, index) => {
          const rowY =
            firstRowY +
            index *
              (photoHeight + rowGap);

          return `
            <circle
              cx="${CARD_WIDTH / 2}"
              cy="${rowY + photoHeight / 2}"
              r="18"
              fill="${accent}"
              opacity="0.92"
            />

            <text
              x="${CARD_WIDTH / 2}"
              y="${
                rowY +
                photoHeight / 2 +
                7
              }"
              text-anchor="middle"
              font-family="Arial, Helvetica, sans-serif"
              font-size="18"
              font-weight="700"
              fill="#ffffff"
            >
              ${index + 1}
            </text>
          `;
        })
        .join("")}

      <line
        x1="120"
        y1="1512"
        x2="780"
        y2="1512"
        stroke="${accent}"
        stroke-width="2"
        opacity="0.28"
      />

      <text
        x="${CARD_WIDTH / 2}"
        y="1582"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="29"
        font-weight="600"
        fill="${accent}"
      >
        ${safeMessage}
      </text>

      <text
        x="${CARD_WIDTH / 2}"
        y="1640"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="21"
        fill="${accent}"
        opacity="0.78"
      >
        ${escapeXml(generatedDate)}
      </text>

      <text
        x="${CARD_WIDTH / 2}"
        y="1710"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="17"
        font-weight="700"
        letter-spacing="4"
        fill="${accent}"
        opacity="0.62"
      >
        MADE TOGETHER
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
      {
        input: Buffer.from(backgroundSvg),
        left: 0,
        top: 0,
      },
      ...photoComposites,
      {
        input: Buffer.from(
          textOverlaySvg
        ),
        left: 0,
        top: 0,
      },
    ])
    .png({
      quality: 100,
      compressionLevel: 9,
    })
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