const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Trainers_Booking_Request
const Trainer_Booking_RequestCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Booking_Request");

// Get Trainers_Booking_Request
router.get("/", async (req, res) => {
  try {
    const result = await Trainer_Booking_RequestCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainers_Booking_Request:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get a specific Trainers_Booking_Request by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Trainer_Booking_RequestCollection.findOne({
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

    const result = await Trainer_Booking_RequestCollection.find({
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
    const result = await Trainer_Booking_RequestCollection.find({
      trainer: trainerName,
    }).toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching trainer bookings:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Post request to create a new booking request
router.post("/", async (req, res) => {
  try {
    const newRequest = req.body; // Assuming the request body contains the new booking details

    if (!newRequest) {
      return res.status(400).send("Invalid request data.");
    }

    const result = await Trainer_Booking_RequestCollection.insertOne(
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

// Update a Trainer Booking Request by _id
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const result = await Trainer_Booking_RequestCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send({ message: "Booking not found or nothing changed." });
    }

    res.send({ message: "Booking updated successfully.", result });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).send({ message: "Failed to update booking." });
  }
});

// Update a specific Trainers_Booking_Request by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const result = await Trainer_Booking_RequestCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send("No booking request was updated.");
    }

    res.send({ message: "Booking request updated successfully." });
  } catch (error) {
    console.error("Error updating booking request:", error);
    res.status(500).send("Something went wrong during the update.");
  }
});

// DELETE Trainer by ID (ID sent in query param)
router.delete("/", async (req, res) => {
  const { id } = req.query;

  if (!id || !ObjectId.isValid(String(id))) {
    return res.status(400).json({ message: "Invalid booking ID format" });
  }

  try {
    const result = await Trainer_Booking_RequestCollection.deleteOne({
      _id: new ObjectId(String(id)), // explicitly cast to string
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting booking",
      error: error.message,
    });
  }
});

// Delete all trainer booking requests
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Trainer_Booking_RequestCollection.deleteMany({});

    if (result.deletedCount > 0) {
      res.send({ message: "All booking requests have been deleted." });
    } else {
      res.status(404).send("No booking requests found.");
    }
  } catch (error) {
    console.error("Error deleting booking requests:", error);
    res.status(500).send("Failed to delete booking requests.");
  }
});

module.exports = router;
