import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { to, subject, text } = await req.json();

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"HelpTask" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });

  return Response.json({ success: true });
}
