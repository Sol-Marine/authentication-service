import { pool } from "../database/db.js";

export const createVerificationToken = async (
  userId,
  otp,
  expiresAt
) => {
  const result = await pool.query(
    `
    INSERT INTO email_verification_tokens (
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