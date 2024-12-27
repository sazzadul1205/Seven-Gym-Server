const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Trainers_Booking_Request
const Trainers_Booking_RequestCollection = client
  .db("Seven-Gym")
  .collection("Trainers_Booking_Request");

// Get Trainers_Booking_Request
router.get("/", async (req, res) => {
  try {
    const result = await Trainers_Booking_RequestCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainers_Booking_Request:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Post request to create a new booking request
router.post("/", async (req, res) => {
  try {
    const newRequest = req.body; // Assuming the request body contains the new booking details

    if (!newRequest) {
      return res.status(400).send("Invalid request data.");
    }

    const result = await Trainers_Booking_RequestCollection.insertOne(
      newRequest
    );

    // Check if the insertedId exists
    if (result.insertedId) {
      res.status(201).send({
        message: "Booking request created successfully.",
        requestId: result.insertedId,
      });
    } else {
      res.status(500).send("Error creating booking request.");
    }
  } catch (error) {
    console.error("Error creating Trainers_Booking_Request:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
