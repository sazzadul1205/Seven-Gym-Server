const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Schedule
const ScheduleCollection = client.db("Seven-Gym").collection("Schedule");

// Get Schedule (as before)
router.get("/", async (req, res) => {
  try {
    const result = await ScheduleCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Post Schedule
router.post("/", async (req, res) => {
  const scheduleData = req.body; // Incoming schedule data from the client

  try {
    // Insert the new schedule into the collection
    const result = await ScheduleCollection.insertOne(scheduleData);
    
    // Send a response with the inserted data or ID
    res.status(201).send({
      message: "Schedule successfully created!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving Schedule:", error);
    res.status(500).send("Failed to save the schedule.");
  }
});

module.exports = router;
