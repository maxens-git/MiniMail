import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
});

await transporter.sendMail({
  from: 'test@local.dev',
  to: 'hllev5lo@example.org',
  subject: 'Test local',
  text: 'Ceci est un mail de test local.'
});
