const nodemailer = require("nodemailer");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    // Don't throw — email failures should not break the API response
  }
};

// ── Email templates ──────────────────────────────────────
const sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: "Welcome to Salon!",
    html: `<h2>Hi ${user.name}!</h2><p>Your account has been created. Book your first appointment today!</p>`,
  });

const sendAppointmentConfirmation = (user, appointment, service, staff) =>
  sendEmail({
    to: user.email,
    subject: "Appointment Confirmed!",
    html: `
      <h2>Hi ${user.name}, your appointment is confirmed!</h2>
      <p><strong>Service:</strong> ${service.name}</p>
      <p><strong>Staff:</strong> ${staff.user.name}</p>
      <p><strong>Date & Time:</strong> ${new Date(appointment.scheduledAt).toLocaleString("en-IN")}</p>
      <p><strong>Duration:</strong> ${appointment.durationMins} minutes</p>
      <p><strong>Amount Paid:</strong> ₹${appointment.priceAtBooking}</p>
    `,
  });

const sendAppointmentCancellation = (user, appointment) =>
  sendEmail({
    to: user.email,
    subject: "Appointment Cancelled",
    html: `<h2>Hi ${user.name}</h2><p>Your appointment on ${new Date(appointment.scheduledAt).toLocaleString("en-IN")} has been cancelled. If you paid, a refund will be processed within 5-7 business days.</p>`,
  });

const sendPaymentReceipt = (user, payment) =>
  sendEmail({
    to: user.email,
    subject: `Payment Receipt - ₹${payment.amount}`,
    html: `<h2>Payment Successful!</h2><p>Amount: ₹${payment.amount}</p><p>Transaction ID: ${payment.gatewayPaymentId}</p>`,
  });

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendPaymentReceipt,
};