const crypto = require("crypto");
const Razorpay = require("razorpay");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createError } = require("../middleware/errorHandler");
const { auditLog } = require("../utils/auditLog");
const { sendPaymentReceipt } = require("../utils/email");
const logger = require("../utils/logger");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /api/payments/create-order ─────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { payment: true },
    });

    if (!appointment) return next(createError("Appointment not found.", 404));
    if (appointment.userId !== req.user.id) return next(createError("Access denied.", 403));
    if (appointment.payment?.status === "SUCCESS") return next(createError("This appointment is already paid.", 400));

    // Amount in paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(Number(appointment.priceAtBooking) * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${appointmentId.slice(0, 10)}`,
      notes: { appointmentId, userId: req.user.id },
    });

    // Create or update payment record
    await prisma.payment.upsert({
      where: { appointmentId },
      update: { gatewayOrderId: order.id, status: "PENDING" },
      create: {
        appointmentId,
        amount: appointment.priceAtBooking,
        currency: "INR",
        status: "PENDING",
        method: "RAZORPAY",
        gatewayOrderId: order.id,
      },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payments/verify ────────────────────────────
// Called from frontend after Razorpay checkout success
exports.verifyPayment = async (req, res, next) => {
  try {
    const { appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Verify HMAC signature — this is the security-critical step
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      logger.warn(`Payment signature mismatch for appointment ${appointmentId}`);
      return next(createError("Payment verification failed. Invalid signature.", 400));
    }

    // 2. Update payment record
    const payment = await prisma.payment.update({
      where: { appointmentId },
      data: {
        status: "SUCCESS",
        gatewayPaymentId: razorpay_payment_id,
        gatewaySignature: razorpay_signature,
        paidAt: new Date(),
      },
    });

    // 3. Confirm the appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CONFIRMED" },
    });

    // 4. Generate invoice number and record
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await prisma.invoice.create({
      data: { paymentId: payment.id, invoiceNumber },
    });

    // 5. Notify user
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    sendPaymentReceipt(user, payment);

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: "payment_success",
        title: "Payment Successful!",
        body: `Payment of ₹${payment.amount} received. Invoice: ${invoiceNumber}`,
      },
    });

    auditLog({ userId: req.user.id, action: "PAYMENT_SUCCESS", entityType: "Payment", entityId: payment.id, newValues: { razorpay_payment_id }, ipAddress: req.ip });

    res.json({ success: true, data: { payment, invoiceNumber }, message: "Payment verified successfully." });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payments/webhook ───────────────────────────
// Razorpay sends server-to-server events here
exports.webhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // Verify webhook authenticity using raw body
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body) // raw Buffer from express.raw()
      .digest("hex");

    if (expectedSignature !== signature) {
      logger.warn("Invalid Razorpay webhook signature received");
      return res.status(400).json({ success: false, message: "Invalid webhook signature." });
    }

    const event = JSON.parse(req.body.toString());
    logger.info(`Razorpay webhook event: ${event.event}`);

    // Handle payment failure event
    if (event.event === "payment.failed") {
      const { order_id, error_description } = event.payload.payment.entity;
      await prisma.payment.updateMany({
        where: { gatewayOrderId: order_id },
        data: { status: "FAILED", failureReason: error_description },
      });
    }

    // Handle refund processed event
    if (event.event === "refund.processed") {
      const { payment_id } = event.payload.refund.entity;
      await prisma.payment.updateMany({
        where: { gatewayPaymentId: payment_id },
        data: { status: "REFUNDED" },
      });
    }

    res.json({ success: true }); // Always respond 200 to webhooks
  } catch (err) {
    logger.error("Webhook processing error:", err);
    res.status(500).json({ success: false });
  }
};

// ── GET /api/payments/my ─────────────────────────────────
exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { appointment: { userId: req.user.id } },
      include: {
        appointment: {
          select: { id: true, scheduledAt: true, service: { select: { name: true } } },
        },
        invoice: { select: { invoiceNumber: true, issuedAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/payments/:id ─────────────────────────────────
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { appointment: true, invoice: true },
    });
    if (!payment) return next(createError("Payment not found.", 404));
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payments/:id/refund ────────────────────────
exports.refundPayment = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return next(createError("Payment not found.", 404));
    if (payment.status !== "SUCCESS") return next(createError("Only successful payments can be refunded.", 400));
    if (!payment.gatewayPaymentId) return next(createError("No gateway payment ID found.", 400));

    // Initiate refund via Razorpay
    const refund = await razorpay.payments.refund(payment.gatewayPaymentId, {
      amount: Math.round(Number(payment.amount) * 100), // Full refund
      notes: { reason: "Admin initiated refund", paymentId: payment.id },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });

    auditLog({ userId: req.user.id, action: "REFUND", entityType: "Payment", entityId: payment.id, newValues: { refundId: refund.id }, ipAddress: req.ip });

    res.json({ success: true, data: { refundId: refund.id }, message: "Refund initiated successfully." });
  } catch (err) {
    next(err);
  }
};