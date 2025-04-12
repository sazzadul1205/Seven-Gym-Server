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
    const { email } = req.query;

    const query = email ? { bookerEmail: email } : {};

    const result = await Trainer_Booking_AcceptedCollection.find(
      query
    ).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Booking_Accepted:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST Trainer_Booking_Accepted
router.post("/", async (req, res) => {
  try {
    const paymentData = { ...req.body };
    delete paymentData._id; // Important: let Mongo generate a new _id

    const result = await Trainer_Booking_AcceptedCollection.insertOne(
      paymentData
    );

    if (result.insertedId) {
      const insertedDoc = await Trainer_Booking_AcceptedCollection.findOne({
        _id: result.insertedId,
      });

      return res.status(201).send(insertedDoc);
    }

    res.status(500).send({ message: "Insertion failed." });
  } catch (error) {
    console.error("Error adding Trainer_Booking_Accepted:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
