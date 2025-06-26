const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection reference
const Class_Booking_RefundCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Refund");

// GET all refund records, optionally filtered by email
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    const query = {};
    if (email) {
      query["applicant.applicantData.email"] = email.trim().toLowerCase();
    }

    const refunds = await Class_Booking_RefundCollection.find(query).toArray();

    res.status(200).json(refunds);
  } catch (error) {
    console.error("Error fetching refunds:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET daily refund status
router.get("/DailyStatus", async (req, res) => {
  try {
    const result = await Class_Booking_RefundCollection.aggregate([
      {
        $match: {
          paid: true,
          droppedAt: { $exists: true },
        },
      },
      {
        $addFields: {
          droppedAtConverted: { $toDate: "$droppedAt" }, // convert string to actual date
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$droppedAtConverted" },
          },
          totalRefundAmount: { $sum: "$refundAmount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: "$_id",
          refundAmount: "$totalRefundAmount",
          count: 1,
          _id: 0,
        },
      },
    ]).toArray();

    res.status(200).json(result);
  } catch (error) {
    console.error("Error generating daily refund summary:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST a new refund record
router.post("/", async (req, res) => {
  try {
    const refundData = req.body;

    if (!refundData || Object.keys(refundData).length === 0) {
      return res.status(400).json({ message: "No refund data provided" });
    }

    const result = await Class_Booking_RefundCollection.insertOne(refundData);
    res.status(201).json({
      message: "Refund record created",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error posting refund:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
