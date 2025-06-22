const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

const AcceptedCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Accepted");

const CompletedCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Completed");

console.log("[ClassCompletedRemove] Cron Job Initialized");

// Helper: Parse 'dd-mm-yyyy' format
const parseCustomDate = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("-");
  return new Date(`${year}-${month}-${day}T23:59:59`);
};

// Function to log the result
const logBookingMoveResult = (result) => {
  if (Array.isArray(result)) {
    console.log(`[BookingMove] ${result.length} bookings moved.`);
  } else if (result?.error) {
    console.error("[BookingMove] Error:", result.error);
  } else {
    console.log("[BookingMove] No bookings moved.");
  }
};

// ✅ MAIN FUNCTION: Mark and move completed bookings
async function markAndMoveCompletedBookings() {
  try {
    const now = new Date();
    const paidBookings = await AcceptedCollection.find({
      paid: true,
    }).toArray();
    const moved = [];

    for (const booking of paidBookings) {
      const endDate = parseCustomDate(booking.endDate);

      if (endDate && endDate < now) {
        booking.status = "Completed";
        await CompletedCollection.insertOne(booking);
        await AcceptedCollection.deleteOne({ _id: booking._id });
        moved.push(booking._id);
      }
    }

    return moved;
  } catch (error) {
    return { error };
  }
}

//  Cron Job - runs daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("[BookingMove] Running scheduled booking check...");
  const result = await markAndMoveCompletedBookings();
  logBookingMoveResult(result);
});

// Health Check
router.get("/", (req, res) => {
  res.send("Booking move cron is active.");
});

// Manual Trigger
router.get("/RunNow", async (req, res) => {
  const result = await markAndMoveCompletedBookings();
  logBookingMoveResult(result);

  if (Array.isArray(result) && result.length > 0) {
    return res.json({
      message: `${result.length} booking(s) marked 'Completed' and moved.`,
      moved: result,
    });
  }

  if (result?.error) {
    return res.status(500).json({
      message: "Error in booking move check",
      error: result.error,
    });
  }

  res.json({
    message: "Manual booking check completed. No bookings moved.",
    moved: [],
  });
});

module.exports = router;
