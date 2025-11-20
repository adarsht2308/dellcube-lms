export const passwordResetOTPTemplate = (name, otp) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dellcube - Password Reset OTP</title>
      <style>
          body, html {
              margin: 0;
              padding: 0;
              width: 100%;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f5f5f5;
          }
  
          .wrapper {
              background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
              width: 100%;
              padding: 40px 20px;
          }
  
          .container {
              width: 100%;
              max-width: 600px;
              background-color: #ffffff;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              margin: 0 auto;
              overflow: hidden;
          }

          .header {
              background: linear-gradient(135deg, #FFD249 0%, #FFB800 100%);
              padding: 40px 30px;
              text-align: center;
          }

          .logo-container {
              margin-bottom: 20px;
          }

          .logo {
              max-width: 200px;
              height: auto;
              margin: 0 auto;
          }

          .header-title {
              color: #202020;
              font-size: 28px;
              font-weight: 700;
              margin: 0;
              text-align: center;
          }
  
          .content {
              padding: 40px 30px;
              text-align: center;
          }

          .greeting {
              font-size: 20px;
              font-weight: 600;
              color: #202020;
              margin-bottom: 16px;
          }

          .message {
              font-size: 16px;
              line-height: 1.6;
              color: #4a4a4a;
              margin-bottom: 30px;
          }

          .otp-container {
              margin: 30px 0;
          }

          .otp-label {
              font-size: 14px;
              font-weight: 600;
              color: #828083;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 12px;
          }

          .otp-box {
              display: inline-block;
              background: linear-gradient(135deg, #FFD249 0%, #FFB800 100%);
              color: #202020;
              font-size: 36px;
              font-weight: 700;
              letter-spacing: 8px;
              padding: 20px 40px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(255, 210, 73, 0.3);
              margin: 10px 0;
              border: 2px solid #FFD249;
          }

          .info-box {
              background-color: #FFF9E6;
              border-left: 4px solid #FFD249;
              padding: 16px 20px;
              margin: 30px 0;
              border-radius: 8px;
              text-align: left;
          }

          .info-text {
              font-size: 14px;
              color: #4a4a4a;
              line-height: 1.6;
              margin: 0;
          }

          .warning {
              font-size: 14px;
              color: #828083;
              margin-top: 30px;
              font-style: italic;
          }

          .footer {
              background-color: #f9f9f9;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e5e5;
          }

          .footer-text {
              font-size: 12px;
              color: #828083;
              margin: 0;
              line-height: 1.6;
          }

          .footer-link {
              color: #FFD249;
              text-decoration: none;
          }

          .footer-link:hover {
              text-decoration: underline;
          }

          @media only screen and (max-width: 600px) {
              .container {
                  border-radius: 0;
              }

              .header {
                  padding: 30px 20px;
              }

              .content {
                  padding: 30px 20px;
              }

              .otp-box {
                  font-size: 28px;
                  padding: 16px 30px;
                  letter-spacing: 6px;
              }

              .header-title {
                  font-size: 24px;
              }
          }
      </style>
  </head>
  
  <body>
      <div class="wrapper">
          <div class="container">
              <div class="header">
                  <div class="logo-container">
                      <h1 class="header-title">Password Reset</h1>
                  </div>
              </div>
              
              <div class="content">
                  <div class="greeting">Hello ${name}!</div>
                  
                  <p class="message">
                      We received a request to reset your password for your Dellcube account. 
                      Use the verification code below to complete the password reset process.
                  </p>

                  <div class="otp-container">
                      <div class="otp-label">Your Verification Code</div>
                      <div class="otp-box">${otp}</div>
                  </div>

                  <div class="info-box">
                      <p class="info-text">
                          <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>. 
                          If you didn't request a password reset, please ignore this email or contact 
                          our support team if you have concerns.
                      </p>
                  </div>

                  <p class="warning">
                      For security reasons, never share this code with anyone. Dellcube staff will never ask for your verification code.
                  </p>
              </div>

              <div class="footer">
                  <p class="footer-text">
                      &copy; ${new Date().getFullYear()} Dellcube. All rights reserved.<br>
                      This is an automated email, please do not reply.<br>
                      Need help? Contact us at <a href="mailto:info@dellcube.com" class="footer-link">info@dellcube.com</a>
                  </p>
              </div>
          </div>
      </div>
  </body>
  </html>
  `;
};

