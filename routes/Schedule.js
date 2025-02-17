const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

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
router.get("/SchedulesById", async (req, res) => {
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
      return res.status(404).json({
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

// Get schedules by scheduleIDs for a specific user (identified by email)
router.get("/SchedulesEmptyCheck", async (req, res) => {
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
          // Check if the title is empty
          const status = scheduleItem.title
            ? `${scheduleItem.id}: Full`
            : `${scheduleItem.id}: Empty`;
          matchingSchedules.push(status);
        }
      }
    }

    // If no matching schedules are found
    if (matchingSchedules.length === 0) {
      return res.status(404).json({
        message: "No matching schedules found for the provided scheduleIDs.",
      });
    }

    // Return the matching schedules with their statuses
    res.json(matchingSchedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Something went wrong." });
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

// PUT Request to Update Single or Multiple Schedule Entries
router.put("/AddSchedules", async (req, res) => {
  try {
    const { email, scheduleIDs, title, notes, location, status } = req.body;

    if (!email || !Array.isArray(scheduleIDs) || scheduleIDs.length === 0) {
      return res
        .status(400)
        .json({ message: "Email and scheduleIDs are required." });
    }

    // Find the user's schedule
    const userSchedule = await ScheduleCollection.findOne({ email });

    if (!userSchedule) {
      return res.status(404).json({ message: "User not found." });
    }

    let updatedSchedules = [];

    // Iterate through all days in the user's schedule
    for (const day in userSchedule.schedule) {
      for (const time in userSchedule.schedule[day].schedule) {
        const scheduleItem = userSchedule.schedule[day].schedule[time];

        // If the schedule ID matches, update the entry
        if (scheduleIDs.includes(scheduleItem.id)) {
          scheduleItem.title = title || scheduleItem.title;
          scheduleItem.notes = notes || scheduleItem.notes;
          scheduleItem.location = location || scheduleItem.location;
          scheduleItem.status = status || scheduleItem.status;

          updatedSchedules.push(scheduleItem);
        }
      }
    }

    // Save the updated schedule back to the database
    await ScheduleCollection.updateOne(
      { email },
      { $set: { schedule: userSchedule.schedule } }
    );

    res.json({
      message: "Schedules updated successfully.",
      updatedSchedules,
    });
  } catch (error) {
    console.error("Error updating schedules:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Updated Route to Reset Schedule Entries
router.put("/DeleteSchedules", async (req, res) => {
  try {
    const { email, scheduleIDs } = req.body;

    if (!email || !Array.isArray(scheduleIDs) || scheduleIDs.length === 0) {
      return res
        .status(400)
        .json({ message: "Email and scheduleIDs are required." });
    }

    // Find the user's schedule
    const userSchedule = await ScheduleCollection.findOne({ email });

    if (!userSchedule) {
      return res.status(404).json({ message: "User not found." });
    }

    let updatedSchedules = [];

    // Iterate through all days in the user's schedule
    for (const day in userSchedule.schedule) {
      for (const time in userSchedule.schedule[day].schedule) {
        const scheduleItem = userSchedule.schedule[day].schedule[time];

        // If the schedule ID matches, reset the entry
        if (scheduleIDs.includes(scheduleItem.id)) {
          scheduleItem.title = "";
          scheduleItem.notes = "";
          scheduleItem.location = "";
          scheduleItem.status = "";

          updatedSchedules.push(scheduleItem);
        }
      }
    }

    // Save the updated schedule back to the database
    await ScheduleCollection.updateOne(
      { email },
      { $set: { schedule: userSchedule.schedule } }
    );

    res.json({
      message: "Schedules reset successfully.",
      updatedSchedules,
    });
  } catch (error) {
    console.error("Error resetting schedules:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Delete a schedule by _id
router.delete("/Schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid schedule ID format." });
    }

    // Delete the schedule by _id
    const result = await ScheduleCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    res.json({ message: "Schedule deleted successfully." });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

module.exports = router;
