import { pool } from "../database/db.js";

export const createUser = async (
  firstName,
  lastName,
  email,
  passwordHash
) => {
  const result = await pool.query(
    `
    INSERT INTO users (first_name, last_name, email, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `,
    [firstName, lastName, email, passwordHash]
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

export const updatePassword = async (userId, passwordHash) => {
  const result = await pool.query(
    `
    UPDATE users
    SET password_hash = $1
    WHERE id = $2
    RETURNING *;
    `,
    [passwordHash, userId]
  );

  return result.rows[0];
};