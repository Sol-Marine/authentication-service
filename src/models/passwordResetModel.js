import { pool } from "../database/db.js";

// Create reset OTP
export const createPasswordResetToken = async (
  userId,
  otp,
  expiresAt
) => {
  const result = await pool.query(
    `
    INSERT INTO password_reset_tokens (
      user_id,
      otp,
      expires_at
    )
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
    [userId, otp, expiresAt]
  );

  return result.rows[0];
};

// Find latest reset OTP
export const findPasswordResetToken = async (userId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM password_reset_tokens
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
    `,
    [userId]
  );

  return result.rows[0];
};

// Delete reset OTP
export const deletePasswordResetToken = async (userId) => {
  await pool.query(
    `
    DELETE FROM password_reset_tokens
    WHERE user_id = $1;
    `,
    [userId]
  );
};