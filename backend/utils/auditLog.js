const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const auditLog = async ({ userId, action, entityType, entityId, oldValues, newValues, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        oldValues: oldValues ? oldValues : undefined,
        newValues: newValues ? newValues : undefined,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    // Audit log failures should never break business logic
    console.error("Audit log failed:", err.message);
  }
};

module.exports = { auditLog };