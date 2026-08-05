import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import {
  createUser,
  findUserByEmail,
  findUserById,
  verifyUser,
  updatePassword,
  updateUserProfile,
  deactivateUser,
} from "../models/userModel.js";

import {
  createSession,
  findSessionByRefreshTokenId,
  updateSessionRefreshToken,
  deactivateSession,
  deactivateAllSessions,
} from "../models/sessionModel.js";

import {
  createRefreshToken,
  findActiveRefreshTokensByUserId,
  revokeRefreshTokenById,
  revokeAllRefreshTokens,
} from "../models/refreshTokenModel.js";

import {
  createVerificationToken,
  findVerificationToken,
  deleteVerificationToken,
} from "../models/emailverificationmodel.js";

import {
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
} from "../models/passwordResetModel.js";

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./emailService.js";

const OTP_EXPIRY_MS = 15 * 60 * 1000;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export async function registerUser({ first_name, last_name, email, password }) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return { error: "Email already exists.", status: 409 };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser(first_name, last_name, email, hashedPassword);

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  await createVerificationToken(user.id, otp, expiresAt);
  await sendVerificationEmail(email, otp);

  return {
    data: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      is_verified: user.is_verified,
    },
    status: 201,
  };
}

export async function verifyEmail({ email, otp }) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { error: "User not found.", status: 404 };
  }

  const verification = await findVerificationToken(user.id);
  if (!verification) {
    return { error: "Verification token not found.", status: 404 };
  }

  if (verification.otp !== otp) {
    return { error: "Invalid OTP.", status: 400 };
  }

  if (new Date() > new Date(verification.expires_at)) {
    return { error: "OTP has expired.", status: 400 };
  }

  await verifyUser(user.id);
  await deleteVerificationToken(user.id);

  return { message: "Email verified successfully." };
}

export async function resendVerification({ email }) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { error: "User not found.", status: 404 };
  }

  if (user.is_verified) {
    return { error: "Email is already verified.", status: 400 };
  }

  await deleteVerificationToken(user.id);

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  await createVerificationToken(user.id, otp, expiresAt);
  await sendVerificationEmail(email, otp);

  return { message: "Verification OTP sent successfully." };
}

export async function loginUser({ email, password }, { ipAddress, userAgent }) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { error: "Invalid email or password.", status: 401 };
  }

  if (!user.is_verified) {
    return { error: "Please verify your email before logging in.", status: 403 };
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return { error: "Invalid email or password.", status: 401 };
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  const savedRefreshToken = await createRefreshToken(
    user.id,
    refreshTokenHash,
    refreshTokenExpiry
  );

  await createSession(user.id, savedRefreshToken.id, ipAddress, userAgent);

  return {
    data: {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    },
  };
}

export async function refreshToken(refresh_token) {
  let decoded;
  try {
    decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return { error: "Invalid or expired refresh token.", status: 401 };
  }

  const userRefreshTokens = await findActiveRefreshTokensByUserId(decoded.id);

  let storedToken = null;
  for (const tokenRecord of userRefreshTokens) {
    const matches = await bcrypt.compare(refresh_token, tokenRecord.token);
    if (matches) {
      storedToken = tokenRecord;
      break;
    }
  }

  if (!storedToken) {
    return { error: "Refresh token not found.", status: 401 };
  }

  if (storedToken.revoked) {
    return { error: "Refresh token has been revoked.", status: 401 };
  }

  if (new Date() > new Date(storedToken.expires_at)) {
    return { error: "Refresh token has expired.", status: 401 };
  }

  const session = await findSessionByRefreshTokenId(storedToken.id);
  if (!session) {
    return { error: "Session not found.", status: 401 };
  }

  const newRefreshToken = jwt.sign(
    { id: decoded.id, email: decoded.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  const newRefreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  const savedNewRefreshToken = await createRefreshToken(
    decoded.id,
    newRefreshTokenHash,
    newRefreshTokenExpiry
  );

  await revokeRefreshTokenById(storedToken.id);
  await updateSessionRefreshToken(session.id, savedNewRefreshToken.id);

  const newAccessToken = jwt.sign(
    { id: decoded.id, email: decoded.email },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  return {
    data: {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    },
  };
}

export async function logoutUser(refresh_token) {
  let decoded;
  try {
    decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return { error: "Invalid or expired refresh token.", status: 401 };
  }

  const userRefreshTokens = await findActiveRefreshTokensByUserId(decoded.id);

  let storedToken = null;
  for (const tokenRecord of userRefreshTokens) {
    const matches = await bcrypt.compare(refresh_token, tokenRecord.token);
    if (matches) {
      storedToken = tokenRecord;
      break;
    }
  }

  if (!storedToken) {
    return { error: "Refresh token not found.", status: 404 };
  }

  const session = await findSessionByRefreshTokenId(storedToken.id);
  if (!session) {
    return { error: "Session not found.", status: 404 };
  }

  await revokeRefreshTokenById(storedToken.id);
  await deactivateSession(session.id);

  return { message: "Logout successful." };
}

export async function logoutAllDevices(user_id) {
  await revokeAllRefreshTokens(user_id);
  await deactivateAllSessions(user_id);
  return { message: "Logged out from all devices successfully." };
}

export async function forgotPassword({ email }) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { error: "User not found.", status: 404 };
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await deletePasswordResetToken(user.id);
  await createPasswordResetToken(user.id, otp, expiresAt);
  await sendPasswordResetEmail(email, otp);

  return { message: "Password reset OTP sent to your email." };
}

export async function verifyResetOtp(otp) {
  if (!otp) {
    return { error: "OTP is required.", status: 400 };
  }

  const resetToken = await findPasswordResetToken(otp);
  if (!resetToken) {
    return { error: "Invalid OTP.", status: 404 };
  }

  if (new Date() > new Date(resetToken.expires_at)) {
    return { error: "OTP has expired.", status: 401 };
  }

  return { message: "OTP verified successfully." };
}

export async function resetPassword({ email, otp, new_password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { error: "User not found.", status: 404 };
  }

  const resetToken = await findPasswordResetToken(otp);
  if (!resetToken) {
    return { error: "Invalid OTP.", status: 404 };
  }

  if (resetToken.user_id !== user.id) {
    return { error: "Invalid OTP.", status: 401 };
  }

  if (new Date() > new Date(resetToken.expires_at)) {
    return { error: "OTP has expired.", status: 400 };
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);
  await updatePassword(user.id, hashedPassword);
  await deletePasswordResetToken(user.id);
  await revokeAllRefreshTokens(user.id);
  await deactivateAllSessions(user.id);

  return {
    message: "Password reset successful. You have been logged out from all devices.",
  };
}

export async function getProfile(userId) {
  const user = await findUserById(userId);
  if (!user) {
    return { error: "User not found.", status: 404 };
  }
  return { data: user };
}

export async function updateProfile(userId, { first_name, last_name }) {
  if (!first_name && !last_name) {
    return { error: "No changes provided.", status: 400 };
  }

  const updatedUser = await updateUserProfile(userId, first_name, last_name);
  return { data: updatedUser, message: "Profile updated successfully." };
}

export async function deactivateAccount(userId) {
  await deactivateUser(userId);
  await revokeAllRefreshTokens(userId);
  await deactivateAllSessions(userId);
  return { message: "Account deactivated successfully." };
}
