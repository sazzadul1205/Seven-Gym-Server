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
  const { id } = req.query;

  try {
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).send("Invalid ID format.");
      }

      const result = await Trainer_Booking_RequestCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!result) {
        return res.status(404).send("Booking request not found.");
      }

      return res.send(result);
    }

    // No ID provided — return all
    const result = await Trainer_Booking_RequestCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainers_Booking_Request:", error);
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

// Get : Daily Status of Trainer Booking Requests
router.get("/DailyStatus", async (req, res) => {
  try {
    const result = await Trainer_Booking_RequestCollection.aggregate([
      {
        $addFields: {
          // Normalize date to only dd-mm-yyyy format
          bookingDate: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: { $toDate: "$bookedAt" },
            },
          },
        },
      },
      {
        $group: {
          _id: "$bookingDate",
          totalPrice: { $sum: { $toDouble: "$totalPrice" } },
          sessions: { $sum: { $size: "$sessions" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalPrice: 1,
          sessions: 1,
          count: 1,
        },
      },
      { $sort: { date: 1 } }, // Optional: sort by date ascending
    ]).toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching daily booking status:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Post request to create a new booking request
router.post("/", async (req, res) => {
  try {
    let newRequest = req.body;

    if (!newRequest) {
      return res.status(400).send("Invalid request data.");
    }

    // Inject loggedTime in format: dd mm yyyy hh:mm
    const now = new Date();
    const date = now.toLocaleDateString("en-GB").split("/").join(" "); // dd mm yyyy
    const time = now.toTimeString().split(" ")[0].slice(0, 5); // hh:mm
    const loggedTime = `${date} ${time}`;

    newRequest = {
      ...newRequest,
      loggedTime,
    };

    const result = await Trainer_Booking_RequestCollection.insertOne(
      newRequest
    );

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

// PATCH: Update a Trainer Booking Request by ID
router.patch("/:id", async (req, res) => {
  const { id } = req.params; // Extract booking request ID from URL params
  const updateFields = { ...req.body }; // Clone the incoming update fields

  try {
    // Generate current timestamp in 'dd mm yyyy hh:mm' format
    const now = new Date();
    const date = now.toLocaleDateString("en-GB").split("/").join(" "); // e.g., '01 05 2025'
    const time = now.toTimeString().split(" ")[0].slice(0, 5); // e.g., '14:32'
    const loggedTime = `${date} ${time}`;

    updateFields.loggedTime = loggedTime; // Append server-side timestamp

    // Perform the database update
    const result = await Trainer_Booking_RequestCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    // If no document was modified, respond accordingly
    if (result.modifiedCount === 0) {
      console.warn("No document modified. Check ID or data.");
      return res
        .status(404)
        .send({ message: "Booking not found or nothing changed." });
    }

    // ✅ Send success response so the frontend can proceed
    return res.status(200).send({ message: "Booking updated successfully." });
  } catch (error) {
    // Log and return error message on failure
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

    res.send({
      message: "All Trainer Booking Request Deleted Successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all Trainer Booking Request:", error);
    res.status(500).send("Failed to delete booking requests.");
  }
});

module.exports = router;
