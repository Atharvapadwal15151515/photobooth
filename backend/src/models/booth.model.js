import pool from "../config/database.js";

export const createBooth = async ({
  creatorUserId = null,
  creatorName,
  recipientName,
  title = null,
  message = null,
  theme = "classic",
  photoCount = 4,
  inviteToken,
  expiresAt = null,
}) => {
  const query = `
    INSERT INTO booths (
      creator_user_id,
      creator_name,
      recipient_name,
      title,
      message,
      theme,
      photo_count,
      invite_token,
      expires_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9
    )
    RETURNING *
  `;

  const values = [
    creatorUserId,
    creatorName,
    recipientName,
    title,
    message,
    theme,
    photoCount,
    inviteToken,
    expiresAt,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findBoothById = async (boothId) => {
  const query = `
    SELECT *
    FROM booths
    WHERE booth_id = $1
  `;

  const result = await pool.query(query, [boothId]);
  return result.rows[0] || null;
};

export const findBoothByInviteToken = async (
  inviteToken
) => {
  const query = `
    SELECT *
    FROM booths
    WHERE invite_token = $1
  `;

  const result = await pool.query(query, [
    inviteToken,
  ]);

  return result.rows[0] || null;
};

export const findBoothsByCreatorUserId = async (
  creatorUserId
) => {
  const query = `
    SELECT *
    FROM booths
    WHERE creator_user_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [
    creatorUserId,
  ]);

  return result.rows;
};

export const updateBoothStatus = async (
  boothId,
  status
) => {
  const query = `
    UPDATE booths
    SET
      status = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE booth_id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [
    boothId,
    status,
  ]);

  return result.rows[0] || null;
};

export const updateBooth = async (
  boothId,
  {
    creatorName = null,
    recipientName = null,
    title = null,
    message = null,
    theme = null,
    photoCount = null,
    expiresAt = null,
  }
) => {
  const query = `
    UPDATE booths
    SET
      creator_name = COALESCE(
        $2,
        creator_name
      ),
      recipient_name = COALESCE(
        $3,
        recipient_name
      ),
      title = COALESCE($4, title),
      message = COALESCE($5, message),
      theme = COALESCE($6, theme),
      photo_count = COALESCE(
        $7,
        photo_count
      ),
      expires_at = COALESCE(
        $8,
        expires_at
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE booth_id = $1
    RETURNING *
  `;

  const values = [
    boothId,
    creatorName,
    recipientName,
    title,
    message,
    theme,
    photoCount,
    expiresAt,
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const markExpiredBooths = async () => {
  const query = `
    UPDATE booths
    SET
      status = 'EXPIRED',
      updated_at = CURRENT_TIMESTAMP
    WHERE
      expires_at IS NOT NULL
      AND expires_at < CURRENT_TIMESTAMP
      AND status != 'EXPIRED'
      AND status != 'COMPLETED'
    RETURNING booth_id
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const deleteBooth = async (boothId) => {
  const query = `
    DELETE FROM booths
    WHERE booth_id = $1
    RETURNING booth_id
  `;

  const result = await pool.query(query, [boothId]);
  return result.rows[0] || null;
};