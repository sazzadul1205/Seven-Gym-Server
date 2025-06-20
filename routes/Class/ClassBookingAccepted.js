const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Class Booking Accepted
const Class_Booking_AcceptedCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Accepted");

// GET : Get all Class Booking Accepted
router.get("/", async (req, res) => {
  try {
    const result = await Class_Booking_AcceptedCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Class Booking Accepted Data:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST : post Accepted to create a new booking Accepted
router.post("/", async (req, res) => {
  try {
    const newRequest = req.body;

    if (!newRequest) {
      return res.status(400).send("Invalid Accepted data.");
    }

    const result = await Class_Booking_AcceptedCollection.insertOne(newRequest);

    // Check if the insertedId exists
    if (result.insertedId) {
      res.status(201).send({
        message: "Booking Accepted created successfully.",
        requestId: result.insertedId,
      });
    } else {
      res.status(500).send("Error creating booking Accepted.");
    }
  } catch (error) {
    console.error("Error creating Class Booking Accepted:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
