const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Trainer_Booking_History
const Trainer_Booking_HistoryCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Booking_History");

// Get Trainer_Booking_History
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    const query = email ? { bookerEmail: email } : {};

    const result = await Trainer_Booking_HistoryCollection.find(
      query
    ).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Booking_History:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get all booking history by trainerId
router.get("/Trainer/:trainerId", async (req, res) => {
  try {
    const { trainerId } = req.params;

    const query = {
      $or: [
        { trainerId }, // If stored as string
        { trainerId: new ObjectId(trainerId) }, // If stored as ObjectId
      ],
    };

    const result = await Trainer_Booking_HistoryCollection.find(
      query
    ).toArray();

    if (result.length === 0) {
      return res.status(404).send("No bookings found for this trainer.");
    }

    res.send(result);
  } catch (error) {
    console.error("Error fetching bookings by trainerId:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Post request to create a new booking request
router.post("/", async (req, res) => {
  try {
    const newRequest = req.body; // Assuming the request body contains the new booking details

    if (!newRequest || !newRequest.status) {
      return res.status(400).send("Invalid request data. Status is required.");
    }

    const result = await Trainer_Booking_HistoryCollection.insertOne(
      newRequest
    );

    // Check if the insertedId exists
    if (result.insertedId) {
      res.status(201).send({
        message: "Booking History request Created successfully.",
        requestId: result.insertedId,
      });
    } else {
      res.status(500).send("Error creating booking History request.");
    }
  } catch (error) {
    console.error("Error creating Trainer_Booking_History:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.delete("/DeleteAll", async (req, res) => {
  try {
    // Deleting all booking history
    const result = await Trainer_Booking_HistoryCollection.deleteMany({});

    if (result.deletedCount > 0) {
      res.send({ message: "All booking history has been deleted." });
    } else {
      res.status(404).send("No booking history found.");
    }
  } catch (error) {
    console.error("Error deleting booking history:", error);
    res.status(500).send("Failed to delete booking history.");
  }
});

module.exports = router;
