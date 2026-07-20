import pool from "../config/database.js";

export const createUser = async ({
  name,
  email = null,
  passwordHash = null,
  profilePictureUrl = null,
}) => {
  const query = `
    INSERT INTO users (
      name,
      email,
      password_hash,
      profile_picture_url
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      user_id,
      name,
      email,
      profile_picture_url,
      created_at,
      updated_at
  `;

  const values = [
    name,
    email,
    passwordHash,
    profilePictureUrl,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findUserById = async (userId) => {
  const query = `
    SELECT
      user_id,
      name,
      email,
      profile_picture_url,
      created_at,
      updated_at
    FROM users
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
};

export const findUserByEmail = async (email) => {
  const query = `
    SELECT *
    FROM users
    WHERE LOWER(email) = LOWER($1)
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
};

export const updateUser = async (
  userId,
  {
    name = null,
    email = null,
    profilePictureUrl = null,
  }
) => {
  const query = `
    UPDATE users
    SET
      name = COALESCE($2, name),
      email = COALESCE($3, email),
      profile_picture_url = COALESCE(
        $4,
        profile_picture_url
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1
    RETURNING
      user_id,
      name,
      email,
      profile_picture_url,
      created_at,
      updated_at
  `;

  const values = [
    userId,
    name,
    email,
    profilePictureUrl,
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const deleteUser = async (userId) => {
  const query = `
    DELETE FROM users
    WHERE user_id = $1
    RETURNING user_id
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
};