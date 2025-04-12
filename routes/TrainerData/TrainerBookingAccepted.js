const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Trainer_Booking_Accepted
const Trainer_Booking_AcceptedCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Booking_Accepted");

// Get Trainer_Booking_Accepted
router.get("/", async (req, res) => {
  try {
    const result = await Trainer_Booking_AcceptedCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Booking_Accepted:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST Trainer_Booking_Accepted
router.post("/", async (req, res) => {
  try {
    const paymentData = req.body;

    // Insert data directly into the collection
    const result = await Trainer_Booking_AcceptedCollection.insertOne(
      paymentData
    );

    res.status(201).send({
      message: "Booking record added successfully.",
      paymentId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Trainer_Booking_Accepted:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
