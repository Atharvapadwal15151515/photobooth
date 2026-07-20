import pool from "../config/database.js";

export const createParticipant = async ({
  boothId,
  userId = null,
  role,
  displayName,
}) => {
  const query = `
    INSERT INTO participants (
      booth_id,
      user_id,
      role,
      display_name
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    boothId,
    userId,
    role,
    displayName,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findParticipantById = async (
  participantId
) => {
  const query = `
    SELECT *
    FROM participants
    WHERE participant_id = $1
  `;

  const result = await pool.query(query, [
    participantId,
  ]);

  return result.rows[0] || null;
};

export const findParticipantByBoothAndRole =
  async (boothId, role) => {
    const query = `
      SELECT *
      FROM participants
      WHERE booth_id = $1
        AND role = $2
    `;

    const result = await pool.query(query, [
      boothId,
      role,
    ]);

    return result.rows[0] || null;
  };

export const findParticipantsByBoothId = async (
  boothId
) => {
  const query = `
    SELECT *
    FROM participants
    WHERE booth_id = $1
    ORDER BY created_at ASC
  `;

  const result = await pool.query(query, [
    boothId,
  ]);

  return result.rows;
};

export const markParticipantCompleted = async (
  participantId
) => {
  const query = `
    UPDATE participants
    SET
      completed = TRUE,
      completed_at = CURRENT_TIMESTAMP
    WHERE participant_id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [
    participantId,
  ]);

  return result.rows[0] || null;
};

export const updateParticipantName = async (
  participantId,
  displayName
) => {
  const query = `
    UPDATE participants
    SET display_name = $2
    WHERE participant_id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [
    participantId,
    displayName,
  ]);

  return result.rows[0] || null;
};

export const deleteParticipant = async (
  participantId
) => {
  const query = `
    DELETE FROM participants
    WHERE participant_id = $1
    RETURNING participant_id
  `;

  const result = await pool.query(query, [
    participantId,
  ]);

  return result.rows[0] || null;
};