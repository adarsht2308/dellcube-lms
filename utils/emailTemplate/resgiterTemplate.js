export const registerOTPTemplate = (name, otp) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dellcube - Verify Your Registration</title>
      <style>
          body, html {
              margin: 0;
              padding: 0;
              width: 100%;
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f4;
          }
  
          .wrapper {
              background-color: #ffffff;
              width: 100%;
              text-align: center;
              padding: 40px 0;
          }
  
          .container {
              width: 90%;
              max-width: 600px;
              background-color: white;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
              margin: auto;
          }
  
          .logo {
              max-width: 180px;
              margin-bottom: 20px;
          }
  
          .otp-box {
              font-size: 24px;
              font-weight: bold;
              background-color: #5C4C4B;
              color: white;
              padding: 10px 20px;
              border-radius: 5px;
              display: inline-block;
              margin: 20px 0;
          }
  
          .message {
              font-size: 16px;
              color: #333;
              margin-bottom: 20px;
          }
  
          .footer {
              font-size: 14px;
              color: #777;
              margin-top: 30px;
          }
      </style>
  </head>
  
  <body>
      <div class="wrapper">
          <div class="container">
            
              <h2>Welcome to Dellcube, ${name}!</h2>
              <p class="message">Thank you for registering. Please use the OTP below to verify your email address and complete your registration.</p>
              <div class="otp-box">${otp}</div>
              <p class="message">If you did not request this, please ignore this email.</p>
              <div class="footer">&copy; ${new Date().getFullYear()} Dellcube. All rights reserved.</div>
          </div>
      </div>
  </body>
  </html>
  `;
};
