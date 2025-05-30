const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Trainer_Session_Refund
const Trainer_Session_RefundCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Session_Refund");

// GET: Fetch Trainer_Session_Refund with optional filters
router.get("/", async (req, res) => {
  try {
    const { id, bookerEmail, trainerId } = req.query;
    const filter = {};

    // Validate and apply _id if provided
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).send("Invalid ID format.");
      }
      filter._id = new ObjectId(id);
    }

    // Apply nested filters based on actual data structure
    if (bookerEmail) filter["bookingDataForHistory.bookerEmail"] = bookerEmail;
    if (trainerId) filter["bookingDataForHistory.trainerId"] = trainerId;

    const result = await Trainer_Session_RefundCollection.find(
      filter
    ).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Session_Refund:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST Trainer_Session_Refund
router.post("/", async (req, res) => {
  try {
    const paymentData = req.body;

    // Insert data directly into the collection
    const result = await Trainer_Session_RefundCollection.insertOne(
      paymentData
    );

    res.status(201).send({
      message: "Refund record added successfully.",
      paymentId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Trainer_Session_Refund:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE: Remove all Trainer_Session_Refund documents
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Trainer_Session_RefundCollection.deleteMany({});
    res.send({
      message: "All refund records deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(
      "Error deleting all Trainer Session Refund documents:",
      error
    );
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
