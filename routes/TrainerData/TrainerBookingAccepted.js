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

// Get a specific Trainers_Booking_Request by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Trainer_Booking_AcceptedCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!result) {
      return res.status(404).send("Booking request not found.");
    }

    res.send(result);
  } catch (error) {
    console.error("Error fetching booking request by ID:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Trainers Booking Request by bookerEmail
router.get("/Booker/:bookerEmail", async (req, res) => {
  try {
    const { bookerEmail } = req.params;

    const result = await Trainer_Booking_AcceptedCollection.find({
      bookerEmail,
    }).toArray();

    // Always return an array, even if it's empty
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainers_Booking_Request:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET all booking requests for a specific trainer (using route param)
router.get("/Trainer/:trainerName", async (req, res) => {
  const { trainerName } = req.params;

  if (!trainerName) {
    return res.status(400).send("Trainer name is required.");
  }

  try {
    const result = await Trainer_Booking_AcceptedCollection.find({
      trainer: trainerName,
    }).toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching trainer bookings:", error);
    res.status(500).send("Internal Server Error");
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

// Delete All Trainer_Booking_Accepted
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Trainer_Booking_AcceptedCollection.deleteMany({});

    if (result.deletedCount === 0) {
      return res.status(404).send("No bookings found to delete.");
    }

    res.status(200).send(`${result.deletedCount} booking(s) deleted.`);
  } catch (error) {
    console.error("Error deleting Trainer_Booking_Accepted:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
