import { pool } from "../database/db.js";

// Create a refresh token
export async function createRefreshToken(userId, token, expiresAt) {
  const result = await pool.query(
    `
    INSERT INTO refresh_tokens
    (
      user_id,
      token,
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
    [userId, token, expiresAt]
  );

  return result.rows[0];
}

// Find a refresh token
export async function findRefreshToken(token) {
  const result = await pool.query(
    `
    SELECT *
    FROM refresh_tokens
    WHERE token = $1;
    `,
    [token]
  );

  return result.rows[0];
}

// Revoke a refresh token
export async function revokeRefreshToken(token) {
  await pool.query(
    `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE token = $1;
    `,
    [token]
  );
}

// Revoke refresh token by ID
export async function revokeRefreshTokenById(id) {
  await pool.query(
    `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE id = $1;
    `,
    [id]
  );
}


// Delete a refresh token
export async function deleteRefreshToken(token) {
  await pool.query(
    `
    DELETE FROM refresh_tokens
    WHERE token = $1;
    `,
    [token]
  );
}

// Revoke all refresh tokens for a user
export async function revokeAllRefreshTokens(userId) {
  await pool.query(
    `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE user_id = $1;
    `,
    [userId]
  );
}
