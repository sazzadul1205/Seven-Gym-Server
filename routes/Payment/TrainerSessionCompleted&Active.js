const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collections from MongoDB
const Trainer_Session_PaymentCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Session_Payment");

const Trainer_Session_RefundCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Session_Refund");

// Helper function to parse paidAt date string into JS Date object
function parsePaidAt(dateStr) {
  if (!dateStr) return null;

  // Handles dd-mm-yyyyThh:mm format specifically
  if (/^\d{2}-\d{2}-\d{4}T\d{2}:\d{2}$/.test(dateStr)) {
    const [datePart, timePart] = dateStr.split("T");
    const [day, month, year] = datePart.split("-");
    return new Date(`${year}-${month}-${day}T${timePart}:00`);
  }

  // Fallback: try to parse normally
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
}

// Route: Get all Active Sessions
router.get("/ActiveSessions", async (req, res) => {
  try {
    const { bookerEmail, trainerId } = req.query;

    // Step 1: Fetch all refund records to exclude refunded sessions
    const refunds = await Trainer_Session_RefundCollection.find({}).toArray();

    // Step 2: Collect all refunded paymentIDs in a Set for fast lookup
    const refundedPaymentIDs = new Set(
      refunds.map((r) => r.bookingDataForHistory.paymentID.trim())
    );

    // Step 3: Build base query to fetch only paid bookings
    const query = { "BookingInfo.paid": true };

    // Step 4: Add filters if provided (optional)
    if (bookerEmail?.trim()) {
      query["BookingInfo.bookerEmail"] = bookerEmail.trim();
    }
    if (trainerId?.trim()) {
      query["BookingInfo.trainerId"] = trainerId.trim();
    }

    // Step 5: Fetch filtered payment records
    const payments = await Trainer_Session_PaymentCollection.find(
      query
    ).toArray();

    // Step 6: Normalize today's date to midnight for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeSessions = [];

    for (const payment of payments) {
      const paymentID = payment.BookingInfo.paymentID.trim();

      // Skip sessions with refunded payments
      if (refundedPaymentIDs.has(paymentID)) continue;

      // Parse the paidAt timestamp into a valid Date object
      const paidAt = parsePaidAt(payment.BookingInfo.paidAt);
      if (!paidAt) continue;

      // Step 7: Determine session duration in weeks (default to 1)
      let durationWeeks = payment.BookingInfo.durationWeeks;
      if (!durationWeeks || durationWeeks <= 0) durationWeeks = 1;

      // Step 8: Calculate expiration date based on paidAt + duration
      const expirationDate = new Date(paidAt);
      expirationDate.setDate(expirationDate.getDate() + durationWeeks * 7);

      // Step 9: Include only sessions that haven't expired yet
      if (expirationDate >= today) {
        activeSessions.push(payment);
      }
    }

    // Step 10: Return the final list of active sessions
    res.json(activeSessions);
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Route: Get all Completed Sessions
router.get("/CompletedSessions", async (req, res) => {
  try {
    const { bookerEmail, trainerId } = req.query;

    // Step 1: Get refunded paymentIDs
    const refunds = await Trainer_Session_RefundCollection.find({}).toArray();
    const refundedPaymentIDs = new Set(
      refunds.map((r) => r.bookingDataForHistory.paymentID.trim())
    );

    // Step 2: Build query for paid sessions
    const query = { "BookingInfo.paid": true };
    if (bookerEmail?.trim())
      query["BookingInfo.bookerEmail"] = bookerEmail.trim();
    if (trainerId?.trim()) query["BookingInfo.trainerId"] = trainerId.trim();

    // Step 3: Fetch all matching paid sessions
    const payments = await Trainer_Session_PaymentCollection.find(
      query
    ).toArray();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedSessions = [];

    // Step 4: Loop to filter out expired and refunded sessions
    for (const payment of payments) {
      const paymentID = payment.BookingInfo.paymentID.trim();
      if (refundedPaymentIDs.has(paymentID)) continue;

      const paidAt = parsePaidAt(payment.BookingInfo.paidAt);
      if (!paidAt) continue;

      let durationWeeks = payment.BookingInfo.durationWeeks;
      if (!durationWeeks || durationWeeks <= 0) durationWeeks = 1;

      const expirationDate = new Date(paidAt);
      expirationDate.setDate(expirationDate.getDate() + durationWeeks * 7);

      if (expirationDate < today) {
        completedSessions.push(payment);
      }
    }

    res.json(completedSessions);
  } catch (error) {
    console.error("Error fetching completed sessions:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Route: Get daily Status of Active Sessions
router.get("/ActiveSessions/DailyStatus", async (req, res) => {
  try {
    const { bookerEmail, trainerId } = req.query;

    // Step 1: Fetch all refunds and track refunded paymentIDs
    const refunds = await Trainer_Session_RefundCollection.find({}).toArray();
    const refundedPaymentIDs = new Set(
      refunds.map((r) => r.bookingDataForHistory.paymentID.trim())
    );

    // Step 2: Build base query to fetch only paid sessions
    const query = { "BookingInfo.paid": true };

    // Step 3: Apply filters if present
    if (bookerEmail?.trim()) {
      query["BookingInfo.bookerEmail"] = bookerEmail.trim();
    }
    if (trainerId?.trim()) {
      query["BookingInfo.trainerId"] = trainerId.trim();
    }

    // Step 4: Fetch paid & filtered sessions
    const payments = await Trainer_Session_PaymentCollection.find(
      query
    ).toArray();

    // Step 5: Normalize today’s date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Step 6: Prepare map for grouping sessions by paid date
    const dailyStatusMap = new Map();

    for (const payment of payments) {
      const paymentID = payment.BookingInfo.paymentID.trim();
      if (refundedPaymentIDs.has(paymentID)) continue; // Skip refunded

      const paidAt = parsePaidAt(payment.BookingInfo.paidAt);
      if (!paidAt) continue; // Skip if invalid date

      let durationWeeks = payment.BookingInfo.durationWeeks;
      if (!durationWeeks || durationWeeks <= 0) durationWeeks = 1;

      // Calculate expiration date
      const expirationDate = new Date(paidAt);
      expirationDate.setDate(expirationDate.getDate() + durationWeeks * 7);

      // Skip expired sessions
      if (expirationDate < today) continue;

      // Group by paidAt date (yyyy-mm-dd)
      const dateKey = paidAt.toISOString().slice(0, 10);
      const totalPrice = Number(payment.BookingInfo.totalPrice) || 0;

      // Initialize or update status record
      if (!dailyStatusMap.has(dateKey)) {
        dailyStatusMap.set(dateKey, { date: dateKey, count: 0, totalPaid: 0 });
      }

      const status = dailyStatusMap.get(dateKey);
      status.count++;
      status.totalPaid += totalPrice;
    }

    // Step 7: Return sorted summary list by date
    const dailyStatus = Array.from(dailyStatusMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.json(dailyStatus);
  } catch (error) {
    console.error("Error fetching daily status:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Route: Get daily Status of completed Sessions
router.get("/CompletedSessions/DailyStatus", async (req, res) => {
  try {
    const { bookerEmail, trainerId } = req.query;

    // Step 1: Fetch refunded paymentIDs
    const refunds = await Trainer_Session_RefundCollection.find({}).toArray();
    const refundedPaymentIDs = new Set(
      refunds.map((r) => r.bookingDataForHistory.paymentID.trim())
    );

    // Step 2: Build query for paid sessions
    const query = { "BookingInfo.paid": true };
    if (bookerEmail?.trim())
      query["BookingInfo.bookerEmail"] = bookerEmail.trim();
    if (trainerId?.trim()) query["BookingInfo.trainerId"] = trainerId.trim();

    // Step 3: Fetch filtered paid sessions
    const payments = await Trainer_Session_PaymentCollection.find(
      query
    ).toArray();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyStatusMap = new Map();

    // Step 4: Group only completed (expired) sessions by paidAt date
    for (const payment of payments) {
      const paymentID = payment.BookingInfo.paymentID.trim();
      if (refundedPaymentIDs.has(paymentID)) continue;

      const paidAt = parsePaidAt(payment.BookingInfo.paidAt);
      if (!paidAt) continue;

      let durationWeeks = payment.BookingInfo.durationWeeks;
      if (!durationWeeks || durationWeeks <= 0) durationWeeks = 1;

      const expirationDate = new Date(paidAt);
      expirationDate.setDate(expirationDate.getDate() + durationWeeks * 7);

      if (expirationDate >= today) continue; // Only past sessions

      const dateKey = paidAt.toISOString().slice(0, 10);
      const totalPrice = Number(payment.BookingInfo.totalPrice) || 0;

      if (!dailyStatusMap.has(dateKey)) {
        dailyStatusMap.set(dateKey, { date: dateKey, count: 0, totalPaid: 0 });
      }

      const status = dailyStatusMap.get(dateKey);
      status.count++;
      status.totalPaid += totalPrice;
    }

    const dailyStatus = Array.from(dailyStatusMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.json(dailyStatus);
  } catch (error) {
    console.error("Error fetching completed daily status:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
