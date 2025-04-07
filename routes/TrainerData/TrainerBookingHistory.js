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
    const result = await Trainer_Booking_HistoryCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Booking_History:", error);
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

    // You can add more validation for other fields (e.g., 'deletedAt' or other properties)
    console.log("Received booking request:", newRequest); // Log the incoming data

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

module.exports = router;
