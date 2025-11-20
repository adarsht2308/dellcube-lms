import nodemailer from "nodemailer";
import { registerOTPTemplate } from "../emailTemplate/resgiterTemplate.js";
import dotenv from "dotenv";

// configing the dotenv file
dotenv.config();

// console.log(process.env.SMTP_PORT)

export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Function to send OTP via email
export const sendOTPEmail = async (name, email, otp) => {
  try {
    // Ensure SECURE is a boolean (port 465 requires secure: true)
    const isSecure = process.env.SECURE === "true" || process.env.SECURE === true || process.env.SECURE === "1";
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP credentials are not configured. Please set SMTP_USER and SMTP_PASS in your environment variables.");
    }

    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: isSecure || true, // Default to true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your Registeration OTP Code",
      html: registerOTPTemplate(name, otp),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};
