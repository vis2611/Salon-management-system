const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createError } = require("../middleware/errorHandler");
const { auditLog } = require("../utils/auditLog");
const { sendAppointmentConfirmation, sendAppointmentCancellation } = require("../utils/email");

// ── GET /api/appointments ────────────────────────────────
exports.getAppointments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause based on role
    const where = {};
    if (req.user.role === "CUSTOMER") where.userId = req.user.id;
    if (req.user.role === "STAFF") {
      const staff = await prisma.staff.findUnique({ where: { userId: req.user.id } });
      if (staff) where.staffId = staff.id;
    }
    if (status) where.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.scheduledAt = { gte: start, lt: end };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { scheduledAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          service: { select: { id: true, name: true, price: true, durationMins: true } },
          staff: { select: { id: true, user: { select: { name: true } }, specialization: true } },
          payment: { select: { id: true, status: true, amount: true, method: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      success: true,
      data: appointments,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/appointments ───────────────────────────────
exports.createAppointment = async (req, res, next) => {
  try {
    const { serviceId, staffId, scheduledAt, notes, couponCode } = req.body;

    const scheduledDate = new Date(scheduledAt);

    // 1. Validate service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId, isActive: true } });
    if (!service) return next(createError("Service not found or unavailable.", 404));

    // 2. Validate staff exists and offers this service
    const staff = await prisma.staff.findUnique({
      where: { id: staffId, isAvailable: true },
      include: {
        services: true,
        user: { select: { name: true } },
        workingHours: true,
      },
    });
    if (!staff) return next(createError("Staff member not found.", 404));

    const offersService = staff.services.some((ss) => ss.serviceId === serviceId);
    if (!offersService) return next(createError("This staff member does not offer the selected service.", 400));

    // 3. Check staff working hours
    const dayOfWeek = scheduledDate.getDay();
    const workingHour = staff.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);
    if (!workingHour || workingHour.isDayOff) {
      return next(createError("Staff is not available on this day.", 400));
    }

    // 4. Check no overlapping appointment for this staff slot
    // NOTE: endTime is not a DB column — we compute overlap using scheduledAt + durationMins
    const newSlotEnd = new Date(scheduledDate.getTime() + service.durationMins * 60 * 1000);

    // Fetch all active appointments for this staff on this day
    const dayStart = new Date(scheduledDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledDate); dayEnd.setHours(23, 59, 59, 999);
    const existingAppts = await prisma.appointment.findMany({
      where: {
        staffId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      },
      select: { scheduledAt: true, durationMins: true },
    });

    const overlap = existingAppts.some((appt) => {
      const apptEnd = new Date(appt.scheduledAt.getTime() + appt.durationMins * 60 * 1000);
      return scheduledDate < apptEnd && newSlotEnd > appt.scheduledAt;
    });

    if (overlap) return next(createError("This time slot is already booked. Please choose another.", 409));

    // 5. Handle coupon
    let finalPrice = Number(service.price);
    let couponUsageData = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase(), isActive: true },
      });

      if (!coupon) return next(createError("Invalid coupon code.", 400));
      if (coupon.expiresAt && coupon.expiresAt < new Date()) return next(createError("Coupon has expired.", 400));
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return next(createError("Coupon usage limit reached.", 400));
      if (coupon.minOrderAmount && finalPrice < Number(coupon.minOrderAmount))
        return next(createError(`Minimum order amount is ₹${coupon.minOrderAmount}.`, 400));

      // Check if user already used this coupon
      const alreadyUsed = await prisma.couponUsage.findFirst({
        where: { couponId: coupon.id, userId: req.user.id },
      });
      if (alreadyUsed) return next(createError("You have already used this coupon.", 400));

      if (coupon.discountType === "PERCENTAGE") {
        finalPrice = finalPrice - (finalPrice * Number(coupon.discountValue)) / 100;
      } else {
        finalPrice = finalPrice - Number(coupon.discountValue);
      }
      finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
      couponUsageData = coupon;
    }

    // 6. Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user.id,
        staffId,
        serviceId,
        scheduledAt: scheduledDate,
        durationMins: service.durationMins,
        priceAtBooking: finalPrice,
        notes: notes || null,
        status: "CONFIRMED", // Fix 8: auto-confirm since payment is at shop
      },
      include: {
        service: true,
        staff: { include: { user: { select: { name: true } } } },
      },
    });

    // 7. Record coupon usage
    if (couponUsageData) {
      await prisma.$transaction([
        prisma.couponUsage.create({
          data: { couponId: couponUsageData.id, userId: req.user.id, appointmentId: appointment.id },
        }),
        prisma.coupon.update({
          where: { id: couponUsageData.id },
          data: { usedCount: { increment: 1 } },
        }),
      ]);
    }

    // 8. Audit log
    auditLog({ userId: req.user.id, action: "CREATE", entityType: "Appointment", entityId: appointment.id, newValues: appointment, ipAddress: req.ip });

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/appointments/:id ────────────────────────────
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        service: true,
        staff: { include: { user: { select: { name: true, avatarUrl: true } } } },
        payment: true,
        review: true,
      },
    });

    if (!appointment) return next(createError("Appointment not found.", 404));

    // Customers can only see their own
    if (req.user.role === "CUSTOMER" && appointment.userId !== req.user.id) {
      return next(createError("Access denied.", 403));
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/appointments/:id/status ──────────────────
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const existing = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(createError("Appointment not found.", 404));

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
    });

    auditLog({
      userId: req.user.id, action: "UPDATE", entityType: "Appointment",
      entityId: updated.id, oldValues: { status: existing.status }, newValues: { status }, ipAddress: req.ip,
    });

    // Notify customer on confirmation
    if (status === "CONFIRMED") {
      const fullAppt = await prisma.appointment.findUnique({
        where: { id: updated.id },
        include: { user: true, service: true, staff: { include: { user: true } } },
      });
      sendAppointmentConfirmation(fullAppt.user, fullAppt, fullAppt.service, fullAppt.staff);

      await prisma.notification.create({
        data: {
          userId: fullAppt.userId,
          type: "appointment_confirmed",
          title: "Appointment Confirmed!",
          body: `Your ${fullAppt.service.name} appointment on ${new Date(fullAppt.scheduledAt).toLocaleString("en-IN")} is confirmed.`,
        },
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/appointments/:id ─────────────────────────
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!appointment) return next(createError("Appointment not found.", 404));

    // Only the booking owner or admin can cancel
    if (req.user.role === "CUSTOMER" && appointment.userId !== req.user.id) {
      return next(createError("Access denied.", 403));
    }

    if (["COMPLETED", "CANCELLED"].includes(appointment.status)) {
      return next(createError(`Cannot cancel an appointment that is already ${appointment.status}.`, 400));
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });

    sendAppointmentCancellation(appointment.user, appointment);
    auditLog({ userId: req.user.id, action: "CANCEL", entityType: "Appointment", entityId: appointment.id, ipAddress: req.ip });

    res.json({ success: true, data: updated, message: "Appointment cancelled successfully." });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/appointments/check/availability ─────────────
exports.checkAvailability = async (req, res, next) => {
  try {
    const { staffId, date, serviceId } = req.query;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return next(createError("Service not found.", 404));

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { workingHours: true },
    });
    if (!staff) return next(createError("Staff not found.", 404));

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();
    const workingHour = staff.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

    if (!workingHour || workingHour.isDayOff) {
      return res.json({ success: true, data: { available: false, slots: [], reason: "Staff is off on this day." } });
    }

    // Build all possible time slots for the day
    const [startH, startM] = workingHour.startTime.split(":").map(Number);
    const [endH, endM] = workingHour.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const slotDuration = service.durationMins;

    const allSlots = [];
    for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
      const slotStart = new Date(requestedDate);
      slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0);
      allSlots.push(slotStart);
    }

    // Get existing bookings for this staff on this date
    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        staffId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      },
      select: { scheduledAt: true, durationMins: true },
    });

    // Filter out overlapping slots
    const availableSlots = allSlots.filter((slot) => {
      const slotEnd = new Date(slot.getTime() + slotDuration * 60 * 1000);
      return !bookedAppointments.some((booked) => {
        const bookedEnd = new Date(booked.scheduledAt.getTime() + booked.durationMins * 60 * 1000);
        return slot < bookedEnd && slotEnd > booked.scheduledAt;
      });
    });

    res.json({
      success: true,
      data: {
        available: availableSlots.length > 0,
        slots: availableSlots.map((s) => s.toISOString()),
        workingHours: { start: workingHour.startTime, end: workingHour.endTime },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Fix 8 patch: sendConfirmationOnCreate ────────────────
// This is called right after createAppointment creates the record.
// Since status is now auto-CONFIRMED, we send the email immediately.
// The main createAppointment function already does auditLog + coupon.
// We append a notification here by monkey-patching the original export.

const _origCreate = exports.createAppointment;
exports.createAppointment = async (req, res, next) => {
  // Capture the original response
  const origJson = res.json.bind(res);
  let appointmentData = null;

  res.json = (body) => {
    if (body?.success && body?.data) {
      appointmentData = body.data;
    }
    return origJson(body);
  };

  await _origCreate(req, res, next);

  // After response sent, fire notification (non-blocking)
  if (appointmentData?.id) {
    try {
      const { PrismaClient } = require("@prisma/client");
      const p = new PrismaClient();
      await p.notification.create({
        data: {
          userId: appointmentData.userId,
          type: "appointment_confirmed",
          title: "Booking Confirmed!",
          body: `Your ${appointmentData.service?.name || "appointment"} is confirmed for ${new Date(appointmentData.scheduledAt).toLocaleString("en-IN")}. Pay at the salon.`,
        },
      });
      await p.$disconnect();
    } catch { /* non-critical */ }
  }
};