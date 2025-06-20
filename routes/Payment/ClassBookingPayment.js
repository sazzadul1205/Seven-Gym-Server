const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection reference
const Class_Booking_PaymentCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Payment");

// GET: Fetch all or filter by query
// Optional: ?email=user@example.com or ?bookingId=123
router.get("/", async (req, res) => {
  try {
    const { email, bookingId } = req.query;

    const query = {};
    if (email) query.email = email;
    if (bookingId) query.bookingId = bookingId;

    const payments = await Class_Booking_PaymentCollection.find(
      query
    ).toArray();
    res.status(200).json(payments);
  } catch (error) {
    console.error("GET / error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST: Add new payment record
router.post("/", async (req, res) => {
  try {
    const paymentData = req.body;

    if (!paymentData || !paymentData.bookingId || !paymentData.email) {
      return res.status(400).json({ error: "Missing required payment data" });
    }

    const result = await Class_Booking_PaymentCollection.insertOne(paymentData);
    res.status(201).json({ message: "Payment recorded successfully", result });
  } catch (error) {
    console.error("POST / error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE: Remove a payment record by ID
router.delete("/:id", async (req, res) => {
  try {
    const paymentId = req.params.id;

    const result = await Class_Booking_PaymentCollection.deleteOne({
      _id: new ObjectId(paymentId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("DELETE /:id error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

Class_Bookingodule.exports = router;
