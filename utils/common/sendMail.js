import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP email
export const sendOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFD249; text-align: center;">OTP Verification</h2>
          <p>Your OTP is: <strong style="font-size: 24px; color: #202020;">${otp}</strong></p>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, error: error.message };
  }
};

// Send vehicle document expiry notifications
export const sendVehicleExpiryNotification = async (recipients, vehicleData, documentType, expiryDate, daysUntilExpiry) => {
  try {
    const isExpired = daysUntilExpiry <= 0;
    const subject = isExpired 
      ? `🚨 URGENT: ${documentType} EXPIRED for Vehicle ${vehicleData.vehicleNumber}`
      : `⚠️ WARNING: ${documentType} Expiring Soon for Vehicle ${vehicleData.vehicleNumber}`;
    
    const statusText = isExpired 
      ? `has EXPIRED ${Math.abs(daysUntilExpiry)} days ago`
      : `expires in ${daysUntilExpiry} days`;
    
    const urgencyColor = isExpired ? "#dc2626" : "#ea580c";
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FFD249 0%, #FFB800 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: #202020; margin: 0; font-size: 24px;">Vehicle Document Expiry Alert</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid ${urgencyColor};">
          <h2 style="color: ${urgencyColor}; margin-top: 0;">${documentType} ${statusText}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: #202020; margin-top: 0;">Vehicle Details:</h3>
            <p><strong>Vehicle Number:</strong> ${vehicleData.vehicleNumber}</p>
            <p><strong>Vehicle Type:</strong> ${vehicleData.type}</p>
            <p><strong>Company:</strong> ${vehicleData.company?.name || 'N/A'}</p>
            <p><strong>Branch:</strong> ${vehicleData.branch?.name || 'N/A'}</p>
            <p><strong>Current Driver:</strong> ${vehicleData.currentDriver?.name || 'Not Assigned'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="color: #202020; margin-top: 0;">Document Information:</h3>
            <p><strong>Document Type:</strong> ${documentType}</p>
            <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${isExpired ? 'EXPIRED' : 'EXPIRING SOON'}</span></p>
          </div>
          
          ${isExpired ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="color: #dc2626; font-weight: bold; margin: 0;">🚨 IMMEDIATE ACTION REQUIRED: This document has expired and needs immediate renewal!</p>
            </div>
          ` : `
            <div style="background: #fffbeb; border: 1px solid #fed7aa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="color: #ea580c; font-weight: bold; margin: 0;">⚠️ Please take action to renew this document before it expires.</p>
            </div>
          `}
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated notification from Dellcube LMS.<br>
              Please log in to the system to view more details and take necessary action.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email to all recipients
    const emailPromises = recipients.map(recipient => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: subject,
        html: htmlContent,
      };
      return transporter.sendMail(mailOptions);
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`Vehicle expiry notification sent: ${successful} successful, ${failed} failed`);
    
    return { 
      success: true, 
      successful, 
      failed,
      message: `Notifications sent to ${successful} recipients`
    };
  } catch (error) {
    console.error("Error sending vehicle expiry notification:", error);
    return { success: false, error: error.message };
  }
};
