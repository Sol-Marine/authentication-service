import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function verifySmtpConnection() {
  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("SMTP connection failed:", error.message);
    console.error("Check your SMTP_USER and SMTP_PASS in .env");
    return false;
  }
}

export async function sendVerificationEmail(email, otp) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "Auth Service <no-reply@authservice.com>",
      to: email,
      subject: "Verify Your Email - OTP Code",
      html: `
        <h2>Email Verification</h2>
        <p>Your verification OTP is:</p>
        <h1 style="color:#4CAF50;font-size:32px;letter-spacing:8px;">${otp}</h1>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error.message);
    return false;
  }
}

export async function sendPasswordResetEmail(email, otp) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "Auth Service <no-reply@authservice.com>",
      to: email,
      subject: "Password Reset - OTP Code",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your password reset OTP is:</p>
        <h1 style="color:#F44336;font-size:32px;letter-spacing:8px;">${otp}</h1>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error.message);
    return false;
  }
}
