import { pool } from "../database/db.js";


// Create a refresh token
// tokenHash = hashed refresh token stored in database
export async function createRefreshToken(
  userId,
  tokenHash,
  expiresAt
) {

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
    [
      userId,
      tokenHash,
      expiresAt
    ]
  );

  return result.rows[0];
}



// Find all refresh tokens belonging to a user
export async function findRefreshTokensByUserId(userId) {

  const result = await pool.query(
    `
    SELECT *
    FROM refresh_tokens
    WHERE user_id = $1;
    `,
    [
      userId
    ]
  );

  return result.rows;
}



// Find active refresh tokens belonging to a user
// Used because tokens are now hashed
// We cannot search by token directly
export async function findActiveRefreshTokensByUserId(userId) {

  const result = await pool.query(
    `
    SELECT *
    FROM refresh_tokens
    WHERE user_id = $1
    AND revoked = FALSE;
    `,
    [
      userId
    ]
  );

  return result.rows;
}



// Find refresh token by ID
export async function findRefreshTokenById(id) {

  const result = await pool.query(
    `
    SELECT *
    FROM refresh_tokens
    WHERE id = $1;
    `,
    [
      id
    ]
  );

  return result.rows[0];
}



// Revoke refresh token by ID
export async function revokeRefreshTokenById(id) {

  await pool.query(
    `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE id = $1;
    `,
    [
      id
    ]
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
    [
      userId
    ]
  );
}



// Delete refresh token by ID
export async function deleteRefreshTokenById(id) {

  await pool.query(
    `
    DELETE FROM refresh_tokens
    WHERE id = $1;
    `,
    [
      id
    ]
  );
}