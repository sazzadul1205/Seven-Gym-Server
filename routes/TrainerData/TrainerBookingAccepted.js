const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Trainer_Booking_Accepted
const Trainer_Booking_AcceptedCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Booking_Accepted");

// Get Trainer_Booking_Accepted
router.get("/", async (req, res) => {
  try {
    const { email, id } = req.query;

    const query = {};

    if (email) {
      query.bookerEmail = email;
    }

    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch (err) {
        return res.status(400).send("Invalid _id format.");
      }
    }

    const result = await Trainer_Booking_AcceptedCollection.find(
      query
    ).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Booking_Accepted:", error);
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

// GET: Aggregated daily stats for a trainer
router.get("/DailyStats", async (req, res) => {
  try {
    const { trainerId } = req.query;

    if (
      !trainerId ||
      typeof trainerId !== "string" ||
      !ObjectId.isValid(trainerId)
    ) {
      return res.status(400).send("Invalid or missing trainerId.");
    }

    const bookings = await Trainer_Booking_AcceptedCollection.find({
      trainerId,
    }).toArray();

    if (!bookings.length) {
      return res.status(404).send("No bookings found for the given trainerId.");
    }

    const dailyStats = {};

    bookings.forEach((booking) => {
      const day = booking.bookedAt.split("T")[0]; // "22-04-2025"

      if (!dailyStats[day]) {
        dailyStats[day] = {
          day,
          sessions: 0,
          totalPrice: 0,
          estimatedEarnings: 0,
        };
      }

      const price = parseFloat(booking.totalPrice || "0");

      dailyStats[day].sessions += booking.sessions.length;
      dailyStats[day].totalPrice += price;
      dailyStats[day].estimatedEarnings += price; // Raw number
    });

    const result = Object.values(dailyStats).map((entry) => ({
      ...entry,
      totalPrice: entry.totalPrice.toFixed(2), // string version
      estimatedEarnings: entry.estimatedEarnings, // raw number version
    }));

    res.send(result);
  } catch (error) {
    console.error("Error fetching trainer daily stats:", error);
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

// Update Trainer_Booking_Accepted by ID
router.put("/Update/:id", async (req, res) => {
  const { id } = req.params;

  let updatedData = { ...req.body };
  delete updatedData._id; // Don't allow _id update

  try {
    const result = await Trainer_Booking_AcceptedCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send("Booking not found.");
    }

    const updatedDoc = await Trainer_Booking_AcceptedCollection.findOne({
      _id: new ObjectId(id),
    });

    res.send(updatedDoc);
  } catch (error) {
    console.error("Error updating Trainer_Booking_Accepted:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Delete Trainer_Booking_Accepted by ID
router.delete("/Delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Trainer_Booking_AcceptedCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send("Booking not found or already deleted.");
    }

    res.status(200).send(`Booking with ID ${id} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting Trainer_Booking_Accepted by ID:", error);
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
