const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Trainer_Session_Payment
const Trainer_Session_PaymentCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Session_Payment");

// GET: Fetch by optional _id, bookerEmail, trainerId
router.get("/", async (req, res) => {
  try {
    const { id, bookerEmail, trainerId } = req.query;
    const filter = {};

    // If _id is passed, validate and convert to ObjectId
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).send("Invalid ID format.");
      }
      filter._id = new ObjectId(id);
    }

    // Correct filters based on your data structure
    if (bookerEmail) filter["BookingInfo.bookerEmail"] = bookerEmail;
    if (trainerId) filter["BookingInfo.trainerId"] = trainerId;

    const result = await Trainer_Session_PaymentCollection.find(
      filter
    ).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Session_Payment:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET: Daily Stats - Aggregate payments by day with optional filters
router.get("/DailyStats", async (req, res) => {
  try {
    const { bookerEmail, trainerId } = req.query;

    // Base match: only paid sessions
    const matchStage = { "BookingInfo.paid": true };

    // Add optional filters if provided
    if (bookerEmail) {
      matchStage["BookingInfo.bookerEmail"] = bookerEmail;
    }
    if (trainerId) {
      matchStage["BookingInfo.trainerId"] = trainerId;
    }

    const result = await Trainer_Session_PaymentCollection.aggregate([
      { $match: matchStage },

      {
        $project: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $toDate: "$paymentTime" },
              timezone: "UTC", // adjust if needed
            },
          },
          total: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$BookingInfo.totalPrice", "free"] },
                  { $eq: ["$BookingInfo.totalPrice", "0"] },
                  { $eq: ["$BookingInfo.totalPrice", "0.00"] },
                  { $eq: ["$BookingInfo.totalPrice", 0] },
                  { $not: ["$BookingInfo.totalPrice"] },
                ],
              },
              then: 0,
              else: { $toDouble: "$BookingInfo.totalPrice" },
            },
          },
        },
      },

      {
        $group: {
          _id: "$date",
          totalPaid: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },

      { $sort: { _id: -1 } },

      {
        $project: {
          _id: 0,
          date: "$_id",
          totalPaid: 1,
          count: 1,
        },
      },
    ]).toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET: Trainer_Session_Payment by ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await Trainer_Session_PaymentCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!result) {
      return res.status(404).json({ message: "Payment not found." });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching payment by ID:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// POST Trainer_Session_Payment
router.post("/", async (req, res) => {
  try {
    const paymentData = req.body;

    // Insert data directly into the collection
    const result = await Trainer_Session_PaymentCollection.insertOne(
      paymentData
    );

    res.status(201).send({
      message: "Payment record added successfully.",
      paymentId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Trainer_Session_Payment:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE: Remove all Trainer_Session_Payment documents
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Trainer_Session_PaymentCollection.deleteMany({});
    res.send({
      message: "All payment records deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(
      "Error deleting all Trainer_Session_Payment documents:",
      error
    );
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
