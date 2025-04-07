const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

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

// Get Trainers Booking Request by bookerEmail
router.get("/Booker/:bookerEmail", async (req, res) => {
  try {
    const { bookerEmail } = req.params; // Get bookerEmail from the route parameter

    // Query the database for bookings with the specific bookerEmail
    const result = await Trainers_Booking_RequestCollection.find({
      bookerEmail,
    }).toArray();

    // If no bookings are found
    if (result.length === 0) {
      return res.status(404).send("No bookings found for this booker.");
    }

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

// DELETE Trainer by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid booking ID format" });
  }

  try {
    const result = await Trainers_Booking_RequestCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting booking", error: error.message });
  }
});

module.exports = router;
