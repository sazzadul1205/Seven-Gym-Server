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

// Get schedules by scheduleIDs for a specific user (identified by email)
router.get("/Schedules", async (req, res) => {
  try {
    let { scheduleIDs, email } = req.query; // Get scheduleIDs and email from query params

    if (!scheduleIDs || !email) {
      return res
        .status(400)
        .json({ message: "Both email and scheduleIDs are required." });
    }

    // If only one ID is given, convert it into an array
    if (!Array.isArray(scheduleIDs)) {
      scheduleIDs = [scheduleIDs];
    }

    // Fetch user schedule based on email
    const userSchedule = await ScheduleCollection.findOne({ email });

    if (!userSchedule) {
      return res.status(404).json({ message: "User not found." });
    }

    // Extract matching schedules
    const matchingSchedules = [];

    // Loop through the days in the user's schedule
    for (const day in userSchedule.schedule) {
      // Check the day's schedule for matching schedule IDs
      for (const time in userSchedule.schedule[day].schedule) {
        const scheduleItem = userSchedule.schedule[day].schedule[time];

        // If the schedule item's ID matches one of the provided scheduleIDs, add it to matchingSchedules
        if (scheduleIDs.includes(scheduleItem.id)) {
          matchingSchedules.push(scheduleItem);
        }
      }
    }

    // If no matching schedules are found
    if (matchingSchedules.length === 0) {
      return res
        .status(404)
        .json({
          message: "No matching schedules found for the provided scheduleIDs.",
        });
    }

    // Return the matching schedules
    res.json(matchingSchedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

module.exports = router;

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
