const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Class Booking Request
const Class_Booking_RequestCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Request");

// GET : Get all Class Booking Request
router.get("/", async (req, res) => {
  try {
    const result = await Class_Booking_RequestCollection.find().toArray();
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

    const result = await Class_Booking_RequestCollection.insertOne(
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
    console.error("Error creating Class Booking Request:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
