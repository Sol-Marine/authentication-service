import { pool } from "../database/db.js";


// Create a new session
export async function createSession(
  userId,
  refreshTokenId,
  ipAddress,
  userAgent
) {
  const result = await pool.query(
    `
    INSERT INTO sessions
    (
      user_id,
      refresh_token_id,
      ip_address,
      user_agent
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4
    )
    RETURNING *;
    `,
    [
      userId,
      refreshTokenId,
      ipAddress,
      userAgent
    ]
  );

  return result.rows[0];
}


// Find an active session by session ID
export async function findSession(id) {
  const result = await pool.query(
    `
    SELECT *
    FROM sessions
    WHERE id = $1
    AND is_active = TRUE;
    `,
    [id]
  );

  return result.rows[0];
}


// Find an active session by refresh token ID
export async function findSessionByRefreshTokenId(refreshTokenId) {
  const result = await pool.query(
    `
    SELECT *
    FROM sessions
    WHERE refresh_token_id = $1
    AND is_active = TRUE;
    `,
    [refreshTokenId]
  );

  return result.rows[0];
}


// Deactivate a session
export async function deactivateSession(id) {
  await pool.query(
    `
    UPDATE sessions
    SET is_active = FALSE
    WHERE id = $1;
    `,
    [id]
  );
}


// Update last activity
export async function updateLastActivity(id) {
  await pool.query(
    `
    UPDATE sessions
    SET last_activity = CURRENT_TIMESTAMP
    WHERE id = $1;
    `,
    [id]
  );
}


// Update session with new refresh token
export async function updateSessionRefreshToken(
  sessionId,
  refreshTokenId
) {
  const result = await pool.query(
    `
    UPDATE sessions
    SET refresh_token_id = $1,
        last_activity = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
    `,
    [
      refreshTokenId,
      sessionId
    ]
  );

  return result.rows[0];
}

// Deactivate all sessions for a user
export async function deactivateAllSessions(userId) {
  await pool.query(
    `
    UPDATE sessions
    SET is_active = FALSE
    WHERE user_id = $1;
    `,
    [userId]
  );
}