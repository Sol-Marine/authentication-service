import { Hono } from "hono";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { authMiddleware } from "../middleware/authMiddleware.js";

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
  createUser,
  findUserByEmail,
  findUserById,
  verifyUser,
  updatePassword,
  updateUserProfile,
} from "../models/userModel.js";


import {
  createVerificationToken,
  findVerificationToken,
  deleteVerificationToken,
} from "../models/emailVerificationModel.js";

import {
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
} from "../models/passwordResetModel.js";

const auth = new Hono();

// ======================
// Register
// ======================

auth.post("/register", async (c) => {
  try {
    const { first_name, last_name, email, password } = await c.req.json();

    if (!first_name || !last_name || !email || !password) {
      return c.json(
        {
          success: false,
          message: "All fields are required.",
        },
        400
      );
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return c.json(
        {
          success: false,
          message: "Email already exists.",
        },
        409
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser(
      first_name,
      last_name,
      email,
      hashedPassword
    );

    // Generate a 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP expires in 10 minutes
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await createVerificationToken(
      user.id,
      otp,
      expiresAt
    );

    return c.json(
      {
        success: true,
        message: "Registration successful.",
        verification_otp: otp, // Remove this once email sending is implemented
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          is_verified: user.is_verified,
        },
      },
      201
    );
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Registration failed.",
      },
      500
    );
  }
});

// ======================
// Verify Email
// ======================

auth.post("/verify", async (c) => {
  try {
    const { email, otp } = await c.req.json();

    if (!email || !otp) {
      return c.json(
        {
          success: false,
          message: "Email and OTP are required.",
        },
        400
      );
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found.",
        },
        404
      );
    }

    const verification = await findVerificationToken(user.id);

    if (!verification) {
      return c.json(
        {
          success: false,
          message: "Verification token not found.",
        },
        404
      );
    }

    if (verification.otp !== otp) {
      return c.json(
        {
          success: false,
          message: "Invalid OTP.",
        },
        400
      );
    }

    if (new Date() > new Date(verification.expires_at)) {
      return c.json(
        {
          success: false,
          message: "OTP has expired.",
        },
        400
      );
    }

    await verifyUser(user.id);

    await deleteVerificationToken(user.id);

    return c.json({
      success: true,
      message: "Email verified successfully.",
    });

  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Verification failed.",
      },
      500
    );
  }
});
// ======================
// Resend Verification
// ======================

auth.post("/resend-verification", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json(
        {
          success: false,
          message: "Email is required.",
        },
        400
      );
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found.",
        },
        404
      );
    }

    if (user.is_verified) {
      return c.json(
        {
          success: false,
          message: "Email is already verified.",
        },
        400
      );
    }

    // Remove any previous OTP
    await deleteVerificationToken(user.id);

    // Generate a new OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await createVerificationToken(
      user.id,
      otp,
      expiresAt
    );

    return c.json({
      success: true,
      message: "Verification OTP sent successfully.",
      verification_otp: otp // Remove after email integration
    });

  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Failed to resend verification OTP.",
      },
      500
    );
  }
});

// ======================
// Login
// ======================

auth.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        400
      );
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return c.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        401
      );
    }

    if (!user.is_verified) {
      return c.json(
        {
          success: false,
          message: "Please verify your email before logging in.",
        },
        403
      );
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return c.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        401
      );
    }

    const accessToken = jwt.sign(
  {
    id: user.id,
    email: user.email,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1h",
  }
);


    const refreshToken = jwt.sign(
  {
    id: user.id,
    email: user.email,
  },
  process.env.JWT_REFRESH_SECRET,
  {
    expiresIn: "7d",
  }
);

const refreshTokenExpiry = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000
);


// Hash refresh token before storing in database
const refreshTokenHash = await bcrypt.hash(
  refreshToken,
  10
);


const savedRefreshToken = await createRefreshToken(
  user.id,
  refreshTokenHash,
  refreshTokenExpiry
);

const ipAddress =
  c.req.header("x-forwarded-for") ||
  "127.0.0.1";

const userAgent =
  c.req.header("user-agent") ||
  "Unknown";

  await createSession(
  user.id,
  savedRefreshToken.id,
  ipAddress,
  userAgent
);

    return c.json({
      success: true,
      message: "Login successful.",
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Login failed.",
      },
      500
    );
  }
});

// ======================
// Refresh Token
// ======================

auth.post("/refresh", async (c) => {
  try {
    const { refresh_token } = await c.req.json();

    if (!refresh_token) {
      return c.json(
        {
          success: false,
          message: "Refresh token is required.",
        },
        400
      );
    }

   let decoded;

try {
  decoded = jwt.verify(
    refresh_token,
    process.env.JWT_REFRESH_SECRET
  );
} catch (error) {
  return c.json(
    {
      success: false,
      message: "Invalid or expired refresh token.",
    },
    401
  );
}



const userRefreshTokens =
  await findActiveRefreshTokensByUserId(
    decoded.id
  );


let storedToken = null;


for (const tokenRecord of userRefreshTokens) {

  const matches = await bcrypt.compare(
    refresh_token,
    tokenRecord.token
  );


  if (matches) {
    storedToken = tokenRecord;
    break;
  }
}


if (!storedToken) {
  return c.json(
    {
      success:false,
      message:"Refresh token not found.",
    },
    401
  );
}

if (storedToken.revoked) {
  return c.json(
    {
      success: false,
      message: "Refresh token has been revoked.",
    },
    401
  );
}

if (new Date() > new Date(storedToken.expires_at)) {
  return c.json(
    {
      success: false,
      message: "Refresh token has expired.",
    },
    401
  );
}

const session = await findSessionByRefreshTokenId(
  storedToken.id
);

if (!session) {
  return c.json(
    {
      success: false,
      message: "Session not found.",
    },
    401
  );
}

const newRefreshToken = jwt.sign(
  {
    id: decoded.id,
    email: decoded.email,
  },
  process.env.JWT_REFRESH_SECRET,
  {
    expiresIn: "7d",
  }
);


const newRefreshTokenHash = await bcrypt.hash(
  newRefreshToken,
  10
);

const newRefreshTokenExpiry = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000
);


const savedNewRefreshToken = await createRefreshToken(
  decoded.id,
  newRefreshTokenHash,
  newRefreshTokenExpiry
);

await revokeRefreshTokenById(
  storedToken.id
);

await updateSessionRefreshToken(
  session.id,
  savedNewRefreshToken.id
);


const newAccessToken = jwt.sign(
  {
    id: decoded.id,
    email: decoded.email,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1h",
  }
);

return c.json({
  success: true,
  message: "Access token refreshed successfully.",
  access_token: newAccessToken,
  refresh_token: newRefreshToken,
});

  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Failed to refresh token.",
      },
      500
    );
  }
});


// ======================
// Logout
// ======================

auth.post("/logout", async (c) => {
  try {

    const { refresh_token } = await c.req.json();

    if (!refresh_token) {
      return c.json(
        {
          success: false,
          message: "Refresh token is required.",
        },
        400
      );
    }


    let decoded;

    try {

      decoded = jwt.verify(
        refresh_token,
        process.env.JWT_REFRESH_SECRET
      );

    } catch (error) {

      return c.json(
        {
          success: false,
          message: "Invalid or expired refresh token.",
        },
        401
      );

    }


    const userRefreshTokens =
      await findActiveRefreshTokensByUserId(
        decoded.id
      );


    let storedToken = null;


    for (const tokenRecord of userRefreshTokens) {

      const matches = await bcrypt.compare(
        refresh_token,
        tokenRecord.token
      );

      if (matches) {
        storedToken = tokenRecord;
        break;
      }

    }


    if (!storedToken) {
      return c.json(
        {
          success: false,
          message: "Refresh token not found.",
        },
        404
      );
    }


    const session =
      await findSessionByRefreshTokenId(
        storedToken.id
      );


    if (!session) {
      return c.json(
        {
          success: false,
          message: "Session not found.",
        },
        404
      );
    }


    await revokeRefreshTokenById(
      storedToken.id
    );


    await deactivateSession(
      session.id
    );


    return c.json({
      success: true,
      message: "Logout successful.",
    });

  } catch (error) {

    console.error(error);

    return c.json(
      {
        success: false,
        message: "Logout failed.",
      },
      500
    );
  }
});


// ======================
// Logout All Devices
// ======================

auth.post("/logout-all", async (c) => {
  try {

    const { user_id } = await c.req.json();


    if (!user_id) {
      return c.json(
        {
          success:false,
          message:"User id is required."
        },
        400
      );
    }


    await revokeAllRefreshTokens(user_id);


    await deactivateAllSessions(user_id);


    return c.json({
      success:true,
      message:"Logged out from all devices successfully."
    });


  } catch(error) {

    console.error(error);

    return c.json(
      {
        success:false,
        message:"Logout all devices failed."
      },
      500
    );

  }
});

// ======================
// Forgot Password
// ======================

auth.post("/forgot-password", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json(
        {
          success: false,
          message: "Email is required.",
        },
        400
      );
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found.",
        },
        404
      );
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP expires in 10 minutes
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // Delete any existing reset token
    await deletePasswordResetToken(user.id);

    // Save the new reset token
    await createPasswordResetToken(
      user.id,
      otp,
      expiresAt
    );

    return c.json({
      success: true,
      message: "Password reset OTP generated.",
      reset_otp: otp // Remove this once email sending is added
    });

  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Failed to generate reset OTP.",
      },
      500
    );
  }
});


// ======================
// Verify Reset OTP
// ======================

auth.post("/verify-reset-otp", async (c) => {

  try {

    const { otp } = await c.req.json();

    if (!otp) {

      return c.json(
        {
          success: false,
          message: "OTP is required.",
        },
        400
      );

    }

    const resetToken =
      await findPasswordResetToken(otp);

    if (!resetToken) {

      return c.json(
        {
          success: false,
          message: "Invalid OTP.",
        },
        404
      );

    }

    if (
      new Date() >
      new Date(resetToken.expires_at)
    ) {

      return c.json(
        {
          success: false,
          message: "OTP has expired.",
        },
        401
      );

    }

    return c.json({

      success: true,
      message: "OTP verified successfully.",

    });

  } catch (error) {

    console.error(error);

    return c.json(
      {
        success: false,
        message: "OTP verification failed.",
      },
      500
    );

  }

});

// ======================
// Reset Password
// ======================

auth.post("/reset-password", async (c) => {
  try {
    const { email, otp, new_password } = await c.req.json();

    // Validate input
    if (!email || !otp || !new_password) {
      return c.json(
        {
          success: false,
          message: "Email, OTP and new password are required.",
        },
        400
      );
    }

    // Find user
    const user = await findUserByEmail(email);

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found.",
        },
        404
      );
    }

    // Find password reset token
    const resetToken = await findPasswordResetToken(otp);

    if (!resetToken) {
      return c.json(
        {
          success: false,
          message: "Invalid OTP.",
        },
        404
      );
    }

    // Make sure the OTP belongs to this user
    if (resetToken.user_id !== user.id) {
      return c.json(
        {
          success: false,
          message: "Invalid OTP.",
        },
        401
      );
    }

    // Check if OTP has expired
    if (new Date() > new Date(resetToken.expires_at)) {
      return c.json(
        {
          success: false,
          message: "OTP has expired.",
        },
        400
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(
      new_password,
      10
    );

    // Update the user's password
    await updatePassword(
      user.id,
      hashedPassword
    );

    // Delete the password reset token
    await deletePasswordResetToken(user.id);

    // Revoke every refresh token
    await revokeAllRefreshTokens(user.id);

    // Deactivate every session
    await deactivateAllSessions(user.id);

    return c.json({
      success: true,
      message:
        "Password reset successful. You have been logged out from all devices.",
    });

  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Password reset failed.",
      },
      500
    );
  }
});

// ======================
// Current User
// ======================

auth.get("/me", authMiddleware, async (c) => {

  const user = c.get("user");

  const currentUser = await findUserById(
  user.id
);

  return c.json({
    success: true,
    user,
  });

});


// ======================
// Update Profile
// ======================

auth.patch("/me", authMiddleware, async (c) => {
  try {

    const user = c.get("user");

    const { first_name, last_name } =
      await c.req.json();

    if (!first_name && !last_name) {
      return c.json(
        {
          success: false,
          message: "No changes provided.",
        },
        400
      );
    }

    const updatedUser = await updateUserProfile(
      user.id,
      first_name,
      last_name
    );

    return c.json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });


  } catch (error) {

    console.error(error);

    return c.json(
      {
        success: false,
        message: "Failed to update profile.",
      },
      500
    );

  }
});


// ======================
// Delete Account
// ======================

auth.delete("/me", authMiddleware, async (c) => {
  try {

    const user = c.get("user");


  } catch (error) {

    console.error(error);

    return c.json(
      {
        success: false,
        message: "Failed to delete account.",
      },
      500
    );

  }
});


export default auth;