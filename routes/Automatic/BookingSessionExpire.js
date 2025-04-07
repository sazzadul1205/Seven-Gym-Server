const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

const Trainers_Booking_RequestCollection = client
  .db("Seven-Gym")
  .collection("Trainers_Booking_Request");

console.log("🔁 Booking Status Cron Job Initialized");

// Helper: Parse custom 'dd-mm-yyyyTHH:MM' format into Date object
const parseCustomDate = (dateStr) => {
  const [datePart, timePart] = dateStr.split("T");
  const [day, month, year] = datePart.split("-");
  return new Date(`${year}-${month}-${day}T${timePart}`);
};

// Core logic: Check and reject outdated pending bookings
const checkExpiredPendingBookings = async () => {
  try {
    const now = new Date();

    const pendingBookings = await Trainers_Booking_RequestCollection.find({
      status: "Pending",
    }).toArray();

    const outdatedIds = pendingBookings
      .filter((booking) => {
        const bookedDate = parseCustomDate(booking.bookedAt);
        const diffDays = Math.floor((now - bookedDate) / (1000 * 60 * 60 * 24));
        return diffDays >= 7;
      })
      .map((booking) => booking._id);

    if (outdatedIds.length > 0) {
      await Trainers_Booking_RequestCollection.updateMany(
        { _id: { $in: outdatedIds } },
        { $set: { status: "Expired" } }
      );

      console.log(
        `✅ ${outdatedIds.length} outdated bookings marked as Expired.`
      );
    } else {
      console.log("No outdated pending bookings found.");
    }
  } catch (err) {
    console.error("Error checking expired bookings:", err.message);
  }
};

// Run the cron job daily at midnight (00:00)
cron.schedule("0 0 * * *", () => {
  console.log(" Running daily booking expiration check...");
  checkExpiredPendingBookings();
});

// Optional health check routes
router.get("/", (req, res) => {
  res.send(" Booking status cron job is running.");
});

router.get("/status", (req, res) => {
  res.send(
    " Cron job runs daily at midnight to auto-reject expired pending bookings."
  );
});

// Maintenance status route (optional)
router.get("/status", (req, res) => {
  res.send("Check Expired Pending Bookings is set to run daily at midnight.");
});

console.log("Check Expired Tiers is running");

// Manual trigger route (for development/testing only)
router.get("/RunNow", async (req, res) => {
  await checkExpiredPendingBookings();
  res.send("Manual check completed.");
});

module.exports = router;
