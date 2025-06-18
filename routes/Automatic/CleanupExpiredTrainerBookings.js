const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const dayjs = require("dayjs");
const { client } = require("../../config/db");

const Trainer_Booking_AcceptedCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Booking_Accepted");

console.log("[BookingStatusUpdate] Cron Job Initialized");

// Core Logic: Mark expired bookings as "Ended"
async function cleanupExpiredTrainerBookings() {
  const now = dayjs();
  const updated = [];

  try {
    const bookings = await Trainer_Booking_AcceptedCollection.find().toArray();

    for (const booking of bookings) {
      if (!booking.startAt || !booking.durationWeeks) continue;

      const startAtDate = dayjs(booking.startAt, "YYYY-MM-DD");
      const endDate = startAtDate.add(booking.durationWeeks * 7, "day");

      if (endDate.isBefore(now) && booking.status !== "Ended") {
        await Trainer_Booking_AcceptedCollection.updateOne(
          { _id: booking._id },
          { $set: { status: "Ended" } }
        );

        updated.push({
          bookingId: booking._id,
          trainerId: booking.trainerId,
          userId: booking.userId,
          startAt: booking.startAt,
          durationWeeks: booking.durationWeeks,
        });

        console.log(
          `[BookingStatusUpdate] Booking ${booking._id} marked as "Ended".`
        );
      }
    }

    if (updated.length === 0) {
      console.log("[BookingStatusUpdate] No expired bookings found.");
    }

    return updated;
  } catch (error) {
    console.error("[BookingStatusUpdate] Error:", error.message);
    return { error: error.message };
  }
}

// Scheduled: Daily at 03:00 AM
cron.schedule("0 3 * * *", async () => {
  console.log("[BookingStatusUpdate] Scheduled cleanup started...");
  const result = await cleanupExpiredTrainerBookings();
  logBookingResult(result);
});

// 🪵 Logger Helper
function logBookingResult(result) {
  if (Array.isArray(result) && result.length > 0) {
    result.forEach((b) => {
      console.log(
        `[BookingStatusUpdate] Ended: Booking ${b.bookingId} | Trainer: ${b.trainerId} | User: ${b.userId}`
      );
    });
  } else if (result?.error) {
    console.error(`[BookingStatusUpdate] Error: ${result.error}`);
  } else {
    console.log("[BookingStatusUpdate] No updates performed.");
  }
}

// Manual trigger
router.get("/RunNow", async (req, res) => {
  const result = await cleanupExpiredTrainerBookings();
  logBookingResult(result);

  if (Array.isArray(result) && result.length > 0) {
    return res.json({
      message: "Trainer booking status update completed.",
      updated: result,
    });
  }

  if (result?.error) {
    return res.status(500).json({
      message: "Error during trainer booking status update.",
      error: result.error,
    });
  }

  res.json({ message: "No expired bookings found." });
});

// Health/status route
router.get("/", (req, res) => {
  res.send("Trainer booking status cron job is active.");
});

router.get("/status", (req, res) => {
  res.send("Trainer booking status cleanup runs daily at 03:00 AM.");
});

module.exports = router;
