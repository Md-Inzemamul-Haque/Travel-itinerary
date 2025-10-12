import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  const from = `Travel Itinerary App ${process.env.SMTP_USER}`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  console.log("Email sent", info.messageId);
  return info;
};
