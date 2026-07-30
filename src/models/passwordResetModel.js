import { pool } from "../database/db.js";

// ======================
// Create Password Reset Token
// ======================

export async function createPasswordResetToken(
  userId,
  otp,
  expiresAt
) {
  const result = await pool.query(
    `
    INSERT INTO password_reset_tokens
    (
      user_id,
      otp,
      expires_at
    )
    VALUES
    (
      $1,
      $2,
      $3
    )
    RETURNING *;
    `,
    [
      userId,
      otp,
      expiresAt,
    ]
  );

  return result.rows[0];
}


// ======================
// Find Password Reset Token by OTP
// ======================

export async function findPasswordResetToken(
  otp
) {
  const result = await pool.query(
    `
    SELECT *
    FROM password_reset_tokens
    WHERE otp = $1;
    `,
    [
      otp,
    ]
  );

  return result.rows[0];
}


// ======================
// Find Latest Password Reset Token by User ID
// ======================

export async function findLatestPasswordResetToken(
  userId
) {
  const result = await pool.query(
    `
    SELECT *
    FROM password_reset_tokens
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
    `,
    [
      userId,
    ]
  );

  return result.rows[0];
}


// ======================
// Delete Password Reset Tokens
// ======================

export async function deletePasswordResetToken(
  userId
) {
  await pool.query(
    `
    DELETE FROM password_reset_tokens
    WHERE user_id = $1;
    `,
    [
      userId,
    ]
  );
}