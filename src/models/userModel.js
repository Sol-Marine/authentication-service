import { pool } from "../database/db.js";

export const createUser = async (
  firstName,
  lastName,
  email,
  passwordHash
) => {
  const result = await pool.query(
    `
    INSERT INTO users (
      first_name,
      last_name,
      email,
      password_hash
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `,
    [
      firstName,
      lastName,
      email,
      passwordHash
    ]
  );

  return result.rows[0];
};


export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `
    SELECT *
    FROM users
    WHERE email = $1;
    `,
    [email]
  );

  return result.rows[0];
};


// Mark user as verified
export const verifyUser = async (userId) => {
  const result = await pool.query(
    `
    UPDATE users
    SET is_verified = true
    WHERE id = $1
    RETURNING *;
    `,
    [userId]
  );

  return result.rows[0];
};


export const updatePassword = async (
  userId,
  passwordHash
) => {
  const result = await pool.query(
    `
    UPDATE users
    SET password_hash = $1
    WHERE id = $2
    RETURNING *;
    `,
    [
      passwordHash,
      userId
    ]
  );

  return result.rows[0];
};


// Find user by ID
export const findUserById = async (id) => {

  const result = await pool.query(
    `
    SELECT
      id,
      first_name,
      last_name,
      email,
      is_verified,
      created_at
    FROM users
    WHERE id = $1;
    `,
    [id]
  );

  return result.rows[0];
};


// Update user profile
export const updateUserProfile = async (
  userId,
  firstName,
  lastName
) => {

  const result = await pool.query(
    `
    UPDATE users
    SET
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name)
    WHERE id = $3
    RETURNING
      id,
      first_name,
      last_name,
      email,
      is_verified,
      created_at;
    `,
    [
      firstName,
      lastName,
      userId
    ]
  );

  return result.rows[0];
};

// Deactivate user account
export const deactivateUser = async (userId) => {

  const result = await pool.query(
    `
    UPDATE users
    SET is_active = false
    WHERE id = $1
    RETURNING
      id,
      first_name,
      last_name,
      email,
      is_active;
    `,
    [
      userId
    ]
  );

  return result.rows[0];
};