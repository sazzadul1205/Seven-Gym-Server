const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const dayjs = require("dayjs");
const { client } = require("../../config/db");

// Collection for Trainer_Booking_Accepted
const Trainer_Booking_AcceptedCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Booking_Accepted");

// Utility function to update expired bookings
async function cleanupExpiredTrainerBookings() {
  console.log("Maintenance: Trainer bookings status update is starting...");
  try {
    const now = dayjs();
    const bookings = await Trainer_Booking_AcceptedCollection.find(
      {}
    ).toArray();

    for (const booking of bookings) {
      if (!booking.startAt || !booking.durationWeeks) continue;

      const startAtDate = dayjs(booking.startAt, "YYYY-MM-DD");
      const endDate = startAtDate.add(booking.durationWeeks * 7, "day");

      if (endDate.isBefore(now) && booking.status !== "Ended") {
        await Trainer_Booking_AcceptedCollection.updateOne(
          { _id: booking._id },
          { $set: { status: "Ended" } }
        );
        console.log(`Booking with _id ${booking._id} marked as Ended.`);
      }
    }
    console.log("Maintenance: Trainer bookings status update completed.");
  } catch (error) {
    console.error("Error updating trainer booking statuses:", error);
  }
}

// Schedule to run daily at 03:00
cron.schedule("0 3 * * *", () => {
  console.log("Scheduled trainer booking status update starting...");
  cleanupExpiredTrainerBookings();
  console.log("Scheduled update finished.");
});

// Manual trigger
router.get("/RunNow", async (req, res) => {
  await cleanupExpiredTrainerBookings();
  res.send("Manual trainer booking status update completed.");
});

// Optional status check
router.get("/status", (req, res) => {
  res.send("Trainer booking cleanup runs daily at 03:00.");
});

console.log("Trainer bookings status update cron is running");

module.exports = router;
