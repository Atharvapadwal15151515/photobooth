import pool from "../config/database.js";

export const createPhoto = async ({
  boothId,
  participantId,
  photoNumber,
  imageUrl,
  cloudinaryPublicId,
}) => {
  const query = `
    INSERT INTO photos (
      booth_id,
      participant_id,
      photo_number,
      image_url,
      cloudinary_public_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    boothId,
    participantId,
    photoNumber,
    imageUrl,
    cloudinaryPublicId,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findPhotoById = async (photoId) => {
  const query = `
    SELECT *
    FROM photos
    WHERE photo_id = $1
  `;

  const result = await pool.query(query, [
    photoId,
  ]);

  return result.rows[0] || null;
};

export const findPhotosByParticipantId = async (
  participantId
) => {
  const query = `
    SELECT *
    FROM photos
    WHERE participant_id = $1
    ORDER BY photo_number ASC
  `;

  const result = await pool.query(query, [
    participantId,
  ]);

  return result.rows;
};

export const findPhotosByBoothId = async (
  boothId
) => {
  const query = `
    SELECT
      ph.*,
      p.role,
      p.display_name
    FROM photos ph
    JOIN participants p
      ON p.participant_id = ph.participant_id
    WHERE ph.booth_id = $1
    ORDER BY
      CASE
        WHEN p.role = 'creator' THEN 1
        WHEN p.role = 'recipient' THEN 2
        ELSE 3
      END,
      ph.photo_number ASC
  `;

  const result = await pool.query(query, [
    boothId,
  ]);

  return result.rows;
};

export const countPhotosByParticipantId = async (
  participantId
) => {
  const query = `
    SELECT COUNT(*)::INTEGER AS photo_count
    FROM photos
    WHERE participant_id = $1
  `;

  const result = await pool.query(query, [
    participantId,
  ]);

  return result.rows[0].photo_count;
};

export const replacePhoto = async (
  participantId,
  photoNumber,
  {
    imageUrl,
    cloudinaryPublicId,
  }
) => {
  const query = `
    UPDATE photos
    SET
      image_url = $3,
      cloudinary_public_id = $4,
      taken_at = CURRENT_TIMESTAMP
    WHERE participant_id = $1
      AND photo_number = $2
    RETURNING *
  `;

  const values = [
    participantId,
    photoNumber,
    imageUrl,
    cloudinaryPublicId,
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const deletePhoto = async (photoId) => {
  const query = `
    DELETE FROM photos
    WHERE photo_id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [
    photoId,
  ]);

  return result.rows[0] || null;
};

export const deletePhotosByParticipantId = async (
  participantId
) => {
  const query = `
    DELETE FROM photos
    WHERE participant_id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [
    participantId,
  ]);

  return result.rows;
};