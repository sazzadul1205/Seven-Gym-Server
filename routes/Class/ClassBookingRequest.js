const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Class Booking Request
const Class_Booking_RequestCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Request");

// GET: Get all Class Booking Requests (optional email filter)
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    // If email is provided, filter; otherwise fetch all
    const query = email ? { "applicantData.email": email.toLowerCase() } : {};

    const result = await Class_Booking_RequestCollection.find(query).toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching Class Booking Request Data:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST : post request to create a new booking request
router.post("/", async (req, res) => {
  try {
    const newRequest = req.body;

    if (!newRequest) {
      return res.status(400).send("Invalid request data.");
    }

    const result = await Class_Booking_RequestCollection.insertOne(newRequest);

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
    console.error("Error creating Class Booking Request:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE: Delete a booking request by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send("Invalid booking ID.");
  }

  try {
    const result = await Class_Booking_RequestCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 1) {
      res.status(200).send({
        message: "Booking request deleted successfully.",
        deletedId: id,
      });
    } else {
      res.status(404).send("Booking request not found.");
    }
  } catch (error) {
    console.error("Error deleting booking request:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE: Delete all Class Booking Request entries
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Class_Booking_RequestCollection.deleteMany({});
    res.send({
      message: "All requested class bookings deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting Class Booking Request data:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
