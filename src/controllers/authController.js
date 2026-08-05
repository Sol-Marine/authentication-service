import * as authService from "../services/authService.js";

import {
  registerSchema,
  loginSchema,
  verifySchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/authValidators.js";

function validate(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }
  return { data: result.data };
}

export async function register(c) {
  try {
    const body = await c.req.json();
    const validation = validate(registerSchema, body);
    if (validation.errors) {
      return c.json({ success: false, errors: validation.errors }, 400);
    }

    const result = await authService.registerUser(validation.data);
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, message: "Registration successful.", data: result.data }, result.status);
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Registration failed." }, 500);
  }
}

export async function verify(c) {
  try {
    const body = await c.req.json();
    const validation = validate(verifySchema, body);
    if (validation.errors) {
      return c.json({ success: false, errors: validation.errors }, 400);
    }

    const result = await authService.verifyEmail(validation.data);
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, message: result.message });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Verification failed." }, 500);
  }
}

export async function resendVerification(c) {
  try {
    const body = await c.req.json();
    const validation = validate(resendVerificationSchema, body);
    if (validation.errors) {
      return c.json({ success: false, errors: validation.errors }, 400);
    }

    const result = await authService.resendVerification(validation.data);
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, message: result.message });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Failed to resend verification OTP." }, 500);
  }
}

export async function login(c) {
  try {
    const body = await c.req.json();
    const validation = validate(loginSchema, body);
    if (validation.errors) {
      return c.json({ success: false, errors: validation.errors }, 400);
    }

    const ipAddress = c.req.header("x-forwarded-for") || "127.0.0.1";
    const userAgent = c.req.header("user-agent") || "Unknown";

    const result = await authService.loginUser(validation.data, { ipAddress, userAgent });
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, message: "Login successful.", data: result.data });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Login failed." }, 500);
  }
}

export async function refresh(c) {
  try {
    const { refresh_token } = await c.req.json();
    if (!refresh_token) {
      return c.json({ success: false, message: "Refresh token is required." }, 400);
    }

    const result = await authService.refreshToken(refresh_token);
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, message: "Access token refreshed successfully.", data: result.data });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Failed to refresh token." }, 500);
  }
}

export async function logout(c) {
  try {
    const { refresh_token } = await c.req.json();
    if (!refresh_token) {
      return c.json({ success: false, message: "Refresh token is required." }, 400);
    }

    const result = await authService.logoutUser(refresh_token);
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, message: result.message });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Logout failed." }, 500);
  }
}

export async function logoutAll(c) {
  try {
    const { user_id } = await c.req.json();
    if (!user_id) {
      return c.json({ success: false, message: "User id is required." }, 400);
    }

    const result = await authService.logoutAllDevices(user_id);
    return c.json({ success: true, message: result.message });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Logout all devices failed." }, 500);
  }
}

export async function forgotPassword(c) {
  try {
    const body = await c.req.json();
    const validation = validate(forgotPasswordSchema, body);
    if (validation.errors) {
      return c.json({ success: false, errors: validation.errors }, 400);
    }

    const result = await authService.forgotPassword(validation.data);
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, message: result.message });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Failed to generate reset OTP." }, 500);
  }
}

export async function verifyResetOtp(c) {
  try {
    const { otp } = await c.req.json();
    const result = await authService.verifyResetOtp(otp);
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, message: result.message });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "OTP verification failed." }, 500);
  }
}

export async function resetPassword(c) {
  try {
    const body = await c.req.json();
    const validation = validate(resetPasswordSchema, body);
    if (validation.errors) {
      return c.json({ success: false, errors: validation.errors }, 400);
    }

    const result = await authService.resetPassword(validation.data);
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, message: result.message });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Password reset failed." }, 500);
  }
}

export async function getMe(c) {
  try {
    const user = c.get("user");
    const result = await authService.getProfile(user.id);
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, data: result.data });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Failed to fetch user profile." }, 500);
  }
}

export async function updateMe(c) {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const result = await authService.updateProfile(user.id, body);
    if (result.error) {
      return c.json({ success: false, message: result.error }, result.status);
    }

    return c.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Failed to update profile." }, 500);
  }
}

export async function deleteMe(c) {
  try {
    const user = c.get("user");
    const result = await authService.deactivateAccount(user.id);
    return c.json({ success: true, message: result.message });
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Failed to delete account." }, 500);
  }
}
