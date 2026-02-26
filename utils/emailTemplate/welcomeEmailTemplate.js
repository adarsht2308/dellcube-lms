export const welcomeEmailTemplate = (name, role) => {
  const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1).replace(/([A-Z])/g, " $1").trim() : "User";
  
  return `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Dellcube</title>
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

          .header-title {
              color: #202020;
              font-size: 32px;
              font-weight: 700;
              margin: 0;
              text-align: center;
          }
  
          .content {
              padding: 40px 30px;
              text-align: center;
          }

          .greeting {
              font-size: 24px;
              font-weight: 600;
              color: #202020;
              margin-bottom: 20px;
          }

          .message {
              font-size: 16px;
              line-height: 1.6;
              color: #4a4a4a;
              margin-bottom: 30px;
              text-align: left;
          }

          .role-box {
              background: linear-gradient(135deg, #FFD249 0%, #FFB800 100%);
              color: #202020;
              font-size: 18px;
              font-weight: 700;
              padding: 20px 40px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(255, 210, 73, 0.3);
              margin: 30px 0;
              border: 2px solid #FFD249;
              display: inline-block;
          }

          .info-box {
              background-color: #FFF9E6;
              border-left: 4px solid #FFD249;
              padding: 20px;
              margin: 30px 0;
              border-radius: 8px;
              text-align: left;
          }

          .info-text {
              font-size: 15px;
              color: #4a4a4a;
              line-height: 1.6;
              margin: 0;
          }

          .closing {
              font-size: 16px;
              color: #202020;
              margin-top: 30px;
              font-weight: 500;
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
              font-weight: 600;
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

              .header-title {
                  font-size: 24px;
              }

              .greeting {
                  font-size: 20px;
              }

              .role-box {
                  font-size: 16px;
                  padding: 16px 30px;
              }
          }
      </style>
  </head>
  
  <body>
      <div class="wrapper">
          <div class="container">
              <div class="header">
                  <h1 class="header-title">Welcome to Dellcube</h1>
              </div>
              
              <div class="content">
                  <div class="greeting">Hello ${name}!</div>
                  
                  <p class="message">
                      On behalf of the entire Dellcube team, we are thrilled to welcome you to our platform. 
                      Your account has been successfully created and you are now part of the Dellcube family.
                  </p>

                  <div class="role-box">
                      Role: ${roleDisplay}
                  </div>

                  <div class="info-box">
                      <p class="info-text">
                          <strong>Getting Started:</strong> You can now log in to your account using your registered email address. 
                          If you have any questions or need assistance, please do not hesitate to reach out to our support team. 
                          We are here to help you succeed.
                      </p>
                  </div>

                  <p class="message">
                      We wish you the very best in your journey with Dellcube. Thank you for choosing us, and we look forward to working with you.
                  </p>

                  <p class="closing">
                      Best Regards,<br>
                      The Dellcube Team
                  </p>
              </div>

              <div class="footer">
                  <p class="footer-text">
                      &copy; ${new Date().getFullYear()} Dellcube. All rights reserved.<br>
                      This is an automated email, please do not reply.<br>
                      Need help? Contact us at <a href="mailto:info@dellcube.com" class="footer-link">info@dellcube.com</a><br>
                      Visit us at <a href="https://www.dellcube.com" class="footer-link" target="_blank">www.dellcube.com</a>
                  </p>
              </div>
          </div>
      </div>
  </body>
  </html>
  `;
};
