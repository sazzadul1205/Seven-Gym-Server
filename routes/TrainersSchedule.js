const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Trainers_Schedule
const Trainers_ScheduleCollection = client
  .db("Seven-Gym")
  .collection("Trainers_Schedule");

// Get Trainers_Schedule
router.get("/", async (req, res) => {
  try {
    const result = await Trainers_ScheduleCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainers_Schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get the next session after a specific time on a specific day
router.get("/SelectedSession", async (req, res, next) => {
  const { trainerId, trainerName, day, time } = req.query;

  if (!day || !time || (!trainerId && !trainerName)) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const trainer = await Trainers_ScheduleCollection.findOne(
      trainerId
        ? { _id: trainerId }
        : { trainerName: { $regex: new RegExp(`^${trainerName}$`, "i") } }
    );

    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    const { trainerSchedule } = trainer;

    if (!trainerSchedule || !trainerSchedule[day]) {
      return res.status(404).json({ error: `No schedule found for ${day}.` });
    }

    const daySchedule = trainerSchedule[day];

    // Return the session only if it exactly matches the provided time.
    if (daySchedule[time]) {
      return res.json({
        trainerName: trainer.trainerName,
        day,
        time,
        session: daySchedule[time],
      });
    }

    // If no exact match is found, return a 404 error.
    return res
      .status(404)
      .json({ error: `No session found at ${time} on ${day}.` });
  } catch (error) {
    console.error("Error fetching session:", error);
    next(error);
  }
});

// Get all sessions for a trainer on a specific Time
router.get("/SameStartSession", async (req, res) => {
  const { trainerName, start } = req.query;

  if (!trainerName || !start) {
    return res
      .status(400)
      .json({ message: "Missing trainerName or start time in query." });
  }

  try {
    const trainer = await Trainers_ScheduleCollection.findOne({ trainerName });

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found." });
    }

    const schedule = trainer.trainerSchedule;
    const matchedSlots = [];

    // Go through each day
    for (const day in schedule) {
      const timeSlot = schedule[day][start];
      if (timeSlot) {
        matchedSlots.push({
          ...timeSlot,
          day,
        });
      }
    }

    res.json(matchedSlots);
  } catch (error) {
    console.error("Error fetching sessions at same start time:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.get("/SameClassTypeSession", async (req, res) => {
  const { trainerName, classType } = req.query;

  try {
    // Fetch the trainer's schedule by name
    const trainer = await Trainers_ScheduleCollection.findOne({ trainerName });

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found." });
    }

    const schedule = trainer.trainerSchedule;
    const matchedSlots = [];

    // Loop through each day and time slot
    for (const day in schedule) {
      for (const time in schedule[day]) {
        const slot = schedule[day][time];
        if (slot.classType === classType) {
          matchedSlots.push({
            ...slot,
            day,
          });
        }
      }
    }

    res.json(matchedSlots);
  } catch (error) {
    console.error("Error filtering schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Trainer_Schedule by Trainer Name
router.get("/ByTrainerName", async (req, res) => {
  const { trainerName } = req.query; // Extract the Trainer Name from the query parameters

  if (!trainerName) {
    return res.status(400).send("Trainer Name query parameter is required.");
  }

  try {
    const result = await Trainers_ScheduleCollection.find({
      trainerName,
    }).toArray(); // Filter by Trainer Name
    if (result.length === 0) {
      return res.status(404).send("Trainer not found.");
    }
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Schedule by trainerName:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Update Trainer's Schedule Endpoint
router.put("/Update", async (req, res) => {
  // Extract the trainer's name and updated schedule from the request body
  const { trainerName, trainerSchedule } = req.body;

  // Validate that both trainerName and trainerSchedule are provided
  if (!trainerName || !trainerSchedule) {
    return res.status(400).send("Trainer name and schedule are required.");
  }

  try {
    // Attempt to update the trainer's schedule in the database
    const result = await Trainers_ScheduleCollection.updateOne(
      { trainerName: trainerName }, // Find the trainer by their name
      { $set: { trainerSchedule: trainerSchedule } } // Update the trainer's schedule with the new data
    );

    // Check if the trainer was found and updated in the database
    if (result.matchedCount === 0) {
      return res.status(404).send("Trainer not found.");
    }

    // Send a success response if the update was successful
    res.send("Trainer schedule updated successfully.");
  } catch (error) {
    // Log the error for debugging and send a server error response
    console.error("Error updating Trainer's Schedule:", error);
    res.status(500).send("Something went wrong while updating the schedule.");
  }
});

module.exports = router;
