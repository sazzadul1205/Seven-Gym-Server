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

// Get Trainer's Weekly Schedule for a Specific Time
router.get("/:name/time/:time", async (req, res, next) => {
  const { name, time } = req.params;

  try {
    // Find trainer by name (case-insensitive)
    const trainer = await Trainers_ScheduleCollection.findOne({
      trainerName: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    const { trainerSchedule } = trainer;

    if (!trainerSchedule || Object.keys(trainerSchedule).length === 0) {
      return res.status(404).json({ error: "Trainer has no schedule data." });
    }

    // Extract matching sessions for the given time
    const weeklyData = Object.entries(trainerSchedule).reduce(
      (result, [day, sessions]) => {
        if (sessions[time]) {
          result[day] = sessions[time];
        }
        return result;
      },
      {}
    );

    if (Object.keys(weeklyData).length === 0) {
      return res.status(404).json({ error: `No sessions found at ${time}.` });
    }

    res.json({
      trainerName: trainer.trainerName,
      schedule: weeklyData,
    });
  } catch (error) {
    console.error("Error fetching trainer's schedule:", error);
    next(error);
  }
});

// Get Trainer's Weekly Schedule for a Specific Class Type
router.get("/:name/classType/:classType", async (req, res, next) => {
  const { name, classType } = req.params;

  try {
    // Find trainer by name (case-insensitive)
    const trainer = await Trainers_ScheduleCollection.findOne({
      trainerName: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    const { trainerSchedule } = trainer;

    if (!trainerSchedule || Object.keys(trainerSchedule).length === 0) {
      return res.status(404).json({ error: "Trainer has no schedule data." });
    }

    // Extract matching sessions for the given class type
    const weeklyData = Object.entries(trainerSchedule).reduce(
      (result, [day, sessions]) => {
        const filteredSessions = Object.entries(sessions).reduce(
          (acc, [time, session]) => {
            if (session.classType.toLowerCase() === classType.toLowerCase()) {
              acc[time] = session;
            }
            return acc;
          },
          {}
        );

        if (Object.keys(filteredSessions).length > 0) {
          result[day] = filteredSessions;
        }
        return result;
      },
      {}
    );

    if (Object.keys(weeklyData).length === 0) {
      return res
        .status(404)
        .json({ error: `No sessions found for class type "${classType}".` });
    }

    res.json({
      trainerName: trainer.trainerName,
      schedule: weeklyData,
    });
  } catch (error) {
    console.error("Error fetching trainer's schedule:", error);
    next(error);
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
