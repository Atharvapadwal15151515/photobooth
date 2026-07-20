import pool from "../config/database.js";

export const createGeneratedCard = async ({
  boothId,
  finalImageUrl,
  cloudinaryPublicId,
  width = 1080,
  height = 1080,
}) => {
  const query = `
    INSERT INTO generated_cards (
      booth_id,
      final_image_url,
      cloudinary_public_id,
      width,
      height
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    boothId,
    finalImageUrl,
    cloudinaryPublicId,
    width,
    height,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findCardById = async (cardId) => {
  const query = `
    SELECT *
    FROM generated_cards
    WHERE card_id = $1
  `;

  const result = await pool.query(query, [
    cardId,
  ]);

  return result.rows[0] || null;
};

export const findCardByBoothId = async (
  boothId
) => {
  const query = `
    SELECT *
    FROM generated_cards
    WHERE booth_id = $1
  `;

  const result = await pool.query(query, [
    boothId,
  ]);

  return result.rows[0] || null;
};

export const updateGeneratedCard = async (
  boothId,
  {
    finalImageUrl,
    cloudinaryPublicId,
    width = 1080,
    height = 1080,
  }
) => {
  const query = `
    UPDATE generated_cards
    SET
      final_image_url = $2,
      cloudinary_public_id = $3,
      width = $4,
      height = $5,
      generated_at = CURRENT_TIMESTAMP
    WHERE booth_id = $1
    RETURNING *
  `;

  const values = [
    boothId,
    finalImageUrl,
    cloudinaryPublicId,
    width,
    height,
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const upsertGeneratedCard = async ({
  boothId,
  finalImageUrl,
  cloudinaryPublicId,
  width = 1080,
  height = 1080,
}) => {
  const query = `
    INSERT INTO generated_cards (
      booth_id,
      final_image_url,
      cloudinary_public_id,
      width,
      height
    )
    VALUES ($1, $2, $3, $4, $5)

    ON CONFLICT (booth_id)
    DO UPDATE SET
      final_image_url =
        EXCLUDED.final_image_url,
      cloudinary_public_id =
        EXCLUDED.cloudinary_public_id,
      width = EXCLUDED.width,
      height = EXCLUDED.height,
      generated_at = CURRENT_TIMESTAMP

    RETURNING *
  `;

  const values = [
    boothId,
    finalImageUrl,
    cloudinaryPublicId,
    width,
    height,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deleteCardByBoothId = async (
  boothId
) => {
  const query = `
    DELETE FROM generated_cards
    WHERE booth_id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [
    boothId,
  ]);

  return result.rows[0] || null;
};