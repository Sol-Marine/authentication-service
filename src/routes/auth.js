import { Hono } from "hono";
import { authMiddleware } from "../middleware/authMiddleware.js";
import * as authController from "../controllers/authController.js";

const auth = new Hono();

auth.post("/register", authController.register);
auth.post("/verify", authController.verify);
auth.post("/resend-verification", authController.resendVerification);
auth.post("/login", authController.login);
auth.post("/refresh", authController.refresh);
auth.post("/logout", authController.logout);
auth.post("/logout-all", authController.logoutAll);
auth.post("/forgot-password", authController.forgotPassword);
auth.post("/verify-reset-otp", authController.verifyResetOtp);
auth.post("/reset-password", authController.resetPassword);

auth.get("/me", authMiddleware, authController.getMe);
auth.patch("/me", authMiddleware, authController.updateMe);
auth.delete("/me", authMiddleware, authController.deleteMe);

export default auth;
