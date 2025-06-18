const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

const Trainer_Booking_RequestCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Booking_Request");

console.log("[BookingExpire] Cron Job Initialized");

// Convert "dd-mm-yyyyTHH:MM" format to Date
function parseCustomDate(dateStr) {
  const [datePart, timePart] = dateStr.split("T");
  const [day, month, year] = datePart.split("-");
  return new Date(`${year}-${month}-${day}T${timePart}`);
}

// Core logic
async function checkExpiredPendingBookings() {
  const now = new Date();
  const logTime = now.toISOString();

  try {
    const pending = await Trainer_Booking_RequestCollection.find({
      status: "Pending",
    }).toArray();

    const expired = pending.filter((booking) => {
      const bookedDate = parseCustomDate(booking.bookedAt);
      const diffDays = Math.floor((now - bookedDate) / (1000 * 60 * 60 * 24));
      return diffDays >= 7;
    });

    if (expired.length === 0) {
      return [];
    }

    const expiredIds = expired.map((b) => b._id);

    const expiredAt = `${now.getDate().toString().padStart(2, "0")}-${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${now.getFullYear()}T${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    await Trainer_Booking_RequestCollection.updateMany(
      { _id: { $in: expiredIds } },
      {
        $set: {
          status: "Expired",
          expiredAt,
          loggedTime: logTime,
        },
      }
    );

    return expired.map((b) => ({
      _id: b._id,
      email: b.email || "unknown",
      bookedAt: b.bookedAt,
      expiredAt,
    }));
  } catch (err) {
    return { error: err.message };
  }
}

// Log output handler
function logExpiredBookings(result) {
  if (Array.isArray(result) && result.length > 0) {
    console.log(`[BookingExpire] ${result.length} expired bookings:`);
    result.forEach((entry) => {
      console.log(
        `- ${entry.email} | ID: ${entry._id} | Booked At: ${entry.bookedAt} → Expired At: ${entry.expiredAt}`
      );
    });
  } else if (result?.error) {
    console.error(`[BookingExpire] Error: ${result.error}`);
  } else {
    console.log("[BookingExpire] No expired pending bookings found.");
  }
}

// Cron scheduler: Daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("[BookingExpire] Scheduled run started...");
  const result = await checkExpiredPendingBookings();
  logExpiredBookings(result);
});

// Health check
router.get("/", (req, res) => {
  res.send("Booking expiration cron job is active.");
});

// Manual run
router.get("/RunNow", async (req, res) => {
  const result = await checkExpiredPendingBookings();
  logExpiredBookings(result);

  if (Array.isArray(result) && result.length > 0) {
    return res.json({
      message: `${result.length} bookings marked as expired.`,
      expired: result,
    });
  }

  if (result?.error) {
    return res.status(500).json({
      message: "Error occurred during booking expiration.",
      error: result.error,
    });
  }

  res.json({ message: "No expired bookings found.", expired: [] });
});

module.exports = router;
