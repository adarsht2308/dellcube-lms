// import nodemailer from "nodemailer";

// export const sendEmail = async (data) => {
//   let transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: process.env.SMTP_SECURE === "true",
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   transporter.verify((err, res) => {
//     if (err) {
//       console.log("Nodemailer error: ", err);
//     }
//     console.log("Server is ready to take our messages");
//   });

//   let info = await transporter.sendMail({
//     from: process.env.SMTP_FROM,
//     to: data.to,
//     ...data,
//   });
//   return info;
// };
