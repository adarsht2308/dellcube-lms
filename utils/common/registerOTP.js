import nodemailer from "nodemailer";
import { registerOTPTemplate } from "../emailTemplate/resgiterTemplate.js";
import { passwordResetOTPTemplate } from "../emailTemplate/passwordResetTemplate.js";
import { welcomeEmailTemplate } from "../emailTemplate/welcomeEmailTemplate.js";
import dotenv from "dotenv";

// configing the dotenv file
dotenv.config();

// Debug: Log environment variables on module load (without exposing passwords)
console.log("\n=== DEBUG: Email Module Loaded ===");
console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET (using default: smtp-relay.brevo.com)'}`);
console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 'NOT SET (using default: 587)'}`);
console.log(`SMTP_USER: ${process.env.SMTP_USER || 'NOT SET (using default: 9fbd25001@smtp-brevo.com)'}`);
console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? `SET (length: ${process.env.SMTP_PASS.length})` : 'NOT SET'}`);
console.log(`BREVO_SMTP_KEY: ${process.env.BREVO_SMTP_KEY ? `SET (length: ${process.env.BREVO_SMTP_KEY.length})` : 'NOT SET'}`);
console.log(`BREVO_API_KEY: ${process.env.BREVO_API_KEY ? `SET (length: ${process.env.BREVO_API_KEY.length})` : 'NOT SET'}`);
console.log(`SMTP_FROM: ${process.env.SMTP_FROM || 'NOT SET (using default: Dellcube <dellcubexservora@gmail.com>)'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log("===================================\n");

export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Test SMTP connection (useful for debugging)
export const testSMTPConnection = async () => {
  console.log("\n=== DEBUG: Testing SMTP Connection ===");
  try {
    const transporter = createBrevoTransporter();
    console.log("DEBUG: Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SUCCESS: SMTP connection verified!");
    console.log("=====================================\n");
    return { success: true, message: "SMTP connection successful" };
  } catch (error) {
    console.error("❌ FAILED: SMTP connection failed!");
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(`Response: ${error.response}`);
    console.error("=====================================\n");
    return { success: false, error: error.message, code: error.code };
  }
};

// Create Brevo SMTP transporter (shared for all emails)
const createBrevoTransporter = (options = {}) => {
  console.log("\n=== DEBUG: Creating SMTP Transporter ===");
  
  const smtpHost = options.host || process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const smtpPort = options.port || parseInt(process.env.SMTP_PORT || "587");
  
  console.log(`DEBUG: SMTP_HOST = ${smtpHost}`);
  console.log(`DEBUG: SMTP_PORT = ${smtpPort}`);
  
  // For Brevo, the username can be just the ID or the full email
  let smtpUser = process.env.SMTP_USER || "9fbd25001@smtp-brevo.com";
  console.log(`DEBUG: SMTP_USER = ${smtpUser}`);
  
  // Try SMTP_PASS first, then BREVO_SMTP_KEY, then BREVO_API_KEY
  const smtpPass = process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY;
  
  if (process.env.SMTP_PASS) {
    console.log(`DEBUG: Using SMTP_PASS (length: ${process.env.SMTP_PASS.length})`);
  } else if (process.env.BREVO_SMTP_KEY) {
    console.log(`DEBUG: Using BREVO_SMTP_KEY (length: ${process.env.BREVO_SMTP_KEY.length})`);
  } else if (process.env.BREVO_API_KEY) {
    console.log(`DEBUG: Using BREVO_API_KEY (length: ${process.env.BREVO_API_KEY.length})`);
  } else {
    console.log(`DEBUG: No SMTP password found in environment variables!`);
  }

  if (!smtpUser || !smtpPass) {
    console.error("\n=== ERROR: Missing SMTP Credentials ===");
    console.error(`SMTP_USER: ${smtpUser ? 'SET' : 'MISSING'}`);
    console.error(`SMTP_PASS: ${smtpPass ? 'SET' : 'MISSING'}`);
    console.error("Please set SMTP_USER and SMTP_PASS (or BREVO_SMTP_KEY) in your .env file");
    console.error("========================================\n");
    throw new Error("SMTP credentials are not configured. Please set SMTP_USER and SMTP_PASS (or BREVO_SMTP_KEY) in your environment variables.");
  }

  const trimmedPass = smtpPass.trim();
  console.log(`DEBUG: Password length after trim: ${trimmedPass.length}`);
  console.log(`DEBUG: Password starts with: ${trimmedPass.substring(0, 10)}...`);
  console.log(`DEBUG: Attempting SMTP connection to ${smtpHost}:${smtpPort} with user: ${smtpUser}`);

  // Determine if using SSL (port 465) or STARTTLS (port 587)
  const isSecure = smtpPort === 465;
  
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: trimmedPass,
    },
    connectionTimeout: 60000, // 60 seconds connection timeout
    greetingTimeout: 30000, // 30 seconds greeting timeout
    socketTimeout: 60000, // 60 seconds socket timeout
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
      minVersion: 'TLSv1.2', // Use modern TLS version
    },
    pool: true, // Use connection pooling
    maxConnections: 5, // Maximum number of connections in pool
    maxMessages: 100, // Maximum messages per connection
    rateDelta: 1000, // Rate limiting
    rateLimit: 5, // Max 5 messages per rateDelta
    debug: true, // Always enable debug for troubleshooting
    logger: true, // Always enable logger for troubleshooting
  });

  console.log("DEBUG: Transporter created successfully");
  console.log("=======================================\n");

  return transporter;
};

// Helper function to send email with retry and fallback ports
const sendEmailWithRetry = async (mailOptions, maxRetries = 2) => {
  const smtpHost = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const defaultPort = parseInt(process.env.SMTP_PORT || "587");
  
  // Try configurations in order: default port, then 465 (SSL), then 2525 (alternative)
  const configs = [
    { port: defaultPort, description: `default port ${defaultPort}` },
    { port: 465, description: "port 465 (SSL)" },
    { port: 2525, description: "port 2525 (alternative)" },
  ];
  
  // Remove duplicate if default port is already 465 or 2525
  const uniqueConfigs = configs.filter((config, index, self) => 
    index === self.findIndex(c => c.port === config.port)
  );
  
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const config of uniqueConfigs) {
      try {
        console.log(`DEBUG: Attempt ${attempt + 1}/${maxRetries} - Trying ${config.description}...`);
        const transporter = createBrevoTransporter({ 
          host: smtpHost, 
          port: config.port 
        });
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ SUCCESS: Email sent using ${config.description}`);
        return info;
      } catch (error) {
        console.error(`❌ FAILED: ${config.description} - ${error.code || error.message}`);
        lastError = error;
        
        // If it's not a connection/timeout error, don't try other ports
        if (error.code !== 'ETIMEDOUT' && error.code !== 'ECONNECTION' && error.code !== 'ESOCKET') {
          throw error;
        }
      }
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < maxRetries - 1) {
      const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
      console.log(`DEBUG: Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError || new Error("Failed to send email after all retries");
};

// Function to send OTP via email
export const sendOTPEmail = async (name, email, otp) => {
  try {
    // Use the specified sender email (default to verified Brevo account email)
    const senderEmail = process.env.SMTP_FROM || "Dellcube <dellcubexservora@gmail.com>";

    let mailOptions = {
      from: senderEmail,
      to: email,
      subject: "Your Registration OTP Code",
      html: registerOTPTemplate(name, otp),
    };

    console.log(`Sending registration OTP email from: ${senderEmail} to: ${email}`);
    await sendEmailWithRetry(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    
    // Provide helpful error message for authentication failures
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error("\n=== SMTP AUTHENTICATION ERROR ===");
      console.error("The SMTP authentication failed. Please check:");
      console.error("1. You need the SMTP Key (not API key) from Brevo dashboard");
      console.error("2. Settings → SMTP & API → SMTP section");
      console.error("3. Use that key as SMTP_PASS in your .env file");
      console.error("===================================\n");
    }
    
    // Handle sender verification errors
    if (error.responseCode === 550 || error.message?.includes('sender')) {
      console.error("\n=== SENDER EMAIL VERIFICATION ERROR ===");
      console.error("The sender email address needs to be verified in Brevo:");
      console.error("1. Go to Brevo dashboard → Settings → Senders");
      console.error("2. Add and verify: noreply@dellcube.com");
      console.error("3. Or use a verified sender email address");
      console.error("==========================================\n");
    }
    
    throw error;
  }
};

// Function to send Password Reset OTP via email
export const sendPasswordResetOTPEmail = async (name, email, otp) => {
  console.log("\n=== DEBUG: Starting Password Reset Email ===");
  console.log(`DEBUG: Recipient name: ${name}`);
  console.log(`DEBUG: Recipient email: ${email}`);
  console.log(`DEBUG: OTP: ${otp}`);
  
  try {
    console.log("DEBUG: Step 1 - Preparing email...");
    
    // Use the specified sender email (default to verified Brevo account email)
    const senderEmail = process.env.SMTP_FROM || "Dellcube <dellcubexservora@gmail.com>";
    console.log(`DEBUG: Sender email: ${senderEmail}`);
    console.log(`DEBUG: SMTP_FROM env var: ${process.env.SMTP_FROM || 'NOT SET (using default)'}`);

    let mailOptions = {
      from: senderEmail,
      to: email,
      subject: "Dellcube Password Reset Verification Code",
      html: passwordResetOTPTemplate(name, otp),
    };

    console.log("DEBUG: Step 2 - Mail options prepared");
    console.log(`DEBUG: From: ${mailOptions.from}`);
    console.log(`DEBUG: To: ${mailOptions.to}`);
    console.log(`DEBUG: Subject: ${mailOptions.subject}`);
    console.log(`DEBUG: HTML template length: ${mailOptions.html.length} characters`);

    console.log("DEBUG: Step 3 - Attempting to send email...");
    console.log(`Sending password reset email from: ${senderEmail} to: ${email}`);
    
    // Send email with retry and fallback ports
    console.log("DEBUG: Sending email with retry mechanism...");
    const info = await sendEmailWithRetry(mailOptions);
    
    console.log("DEBUG: Step 4 - Email sent successfully!");
    console.log(`DEBUG: Message ID: ${info.messageId}`);
    console.log(`DEBUG: Response: ${info.response}`);
    console.log(`Password reset OTP email sent successfully to ${email}`);
    console.log("==========================================\n");
    
    return info;
  } catch (error) {
    console.error("\n=== ERROR: Failed to send password reset email ===");
    console.error(`Error code: ${error.code}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Response code: ${error.responseCode}`);
    console.error(`Response: ${error.response}`);
    console.error(`Command: ${error.command}`);
    
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    
    // Provide helpful error message for authentication failures
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error("\n=== SMTP AUTHENTICATION ERROR ===");
      console.error("The SMTP authentication failed. This usually means:");
      console.error("1. You are using the API key instead of the SMTP key");
      console.error("2. The SMTP key is incorrect or expired");
      console.error("3. The SMTP_USER might be wrong");
      console.error("4. To fix: Get your SMTP key from Brevo dashboard:");
      console.error("   Settings → SMTP & API → SMTP section");
      console.error("   Use that key as SMTP_PASS in your .env file");
      console.error("   Make sure SMTP_USER matches your Brevo account");
      console.error("===================================\n");
    }
    
    // Handle connection errors
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      console.error("\n=== SMTP CONNECTION ERROR ===");
      console.error("Cannot connect to SMTP server. Check:");
      console.error("1. Internet connection and network access");
      console.error(`2. SMTP_HOST is correct: ${smtpHost}`);
      console.error(`3. SMTP_PORT is correct: ${smtpPort}`);
      console.error("4. Firewall/security groups allow outbound connections on port " + smtpPort);
      console.error("5. Try using port 465 with SSL if port 587 is blocked");
      console.error("6. Check if production environment has network restrictions");
      console.error("7. Consider using Brevo API instead of SMTP if SMTP is blocked");
      console.error("================================\n");
    }
    
    // Handle sender verification errors
    if (error.responseCode === 550 || error.message?.includes('sender') || error.message?.includes('550')) {
      console.error("\n=== SENDER EMAIL VERIFICATION ERROR ===");
      console.error("The sender email address needs to be verified in Brevo:");
      console.error("1. Go to Brevo dashboard → Settings → Senders");
      console.error("2. Add and verify: dellcubexservora@gmail.com (if not already verified)");
      console.error("3. Or use a verified sender email address");
      console.error("==========================================\n");
    }
    
    console.error("==========================================\n");
    throw error;
  }
};

// Function to send Welcome email to new users
export const sendWelcomeEmail = async (name, email, role) => {
  try {
    // Use the specified sender email (default to verified Brevo account email)
    const senderEmail = process.env.SMTP_FROM || "Dellcube <dellcubexservora@gmail.com>";

    let mailOptions = {
      from: senderEmail,
      to: email,
      subject: "Welcome to Dellcube",
      html: welcomeEmailTemplate(name, role),
    };

    console.log(`Sending welcome email from: ${senderEmail} to: ${email}`);
    await sendEmailWithRetry(mailOptions);
    console.log(`Welcome email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    
    // Handle sender verification errors
    if (error.responseCode === 550 || error.message?.includes('sender')) {
      console.error("Note: Sender email needs to be verified in Brevo dashboard");
    }
    
    // Don't throw error for welcome emails to avoid breaking user creation
    // Log it but continue with user creation
    console.error("User creation will continue despite welcome email failure");
  }
};
