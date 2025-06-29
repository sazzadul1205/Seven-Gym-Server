const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Class Booking Rejected
const Class_Booking_RejectedCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Rejected");

// GET : Get all Class Booking Rejected (optionally filtered by applicant email)
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    const query = email ? { "applicant.applicantData.email": email } : {};

    const result = await Class_Booking_RejectedCollection.find(query).toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching Class Booking Rejected Data:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST : post Rejected to create a new booking Rejected
router.post("/", async (req, res) => {
  try {
    const newRequest = req.body;

    if (!newRequest) {
      return res.status(400).send("Invalid Rejected data.");
    }

    const result = await Class_Booking_RejectedCollection.insertOne(newRequest);

    // Check if the insertedId exists
    if (result.insertedId) {
      res.status(201).send({
        message: "Booking Rejected created successfully.",
        requestId: result.insertedId,
      });
    } else {
      res.status(500).send("Error creating booking Rejected.");
    }
  } catch (error) {
    console.error("Error creating Class Booking Rejected:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE: Delete all Class Booking Rejected entries
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Class_Booking_RejectedCollection.deleteMany({});
    res.send({
      message: "All rejected class bookings deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting Class Booking Rejected data:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
