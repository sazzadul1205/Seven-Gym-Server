const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Class Booking Completed
const Class_Booking_CompletedCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Completed");

// GET : Get all Class Booking Completed 
router.get("/", async (req, res) => {
  try {
    const result = await Class_Booking_CompletedCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Class Booking Completed Data:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST : post Completed to create a new booking Completed
router.post("/", async (req, res) => {
  try {
    const newRequest = req.body;

    if (!newRequest) {
      return res.status(400).send("Invalid Completed data.");
    }

    const result = await Class_Booking_CompletedCollection.insertOne(newRequest);

    // Check if the insertedId exists
    if (result.insertedId) {
      res.status(201).send({
        message: "Booking Completed created successfully.",
        requestId: result.insertedId,
      });
    } else {
      res.status(500).send("Error creating booking Completed.");
    }
  } catch (error) {
    console.error("Error creating Class Booking Completed:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
