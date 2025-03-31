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
router.get("/:name/time/:time", async (req, res) => {
  const { name, time } = req.params;

  try {
    // Fetch the trainer's data by name
    const trainer = await Trainers_ScheduleCollection.findOne({ name });

    if (!trainer) {
      return res.status(404).send("Trainer not found.");
    }

    const weeklyData = Object.entries(trainer.scheduleWithPrices).reduce(
      (result, [day, sessions]) => {
        const filteredSessions = sessions.filter(
          (session) => session.timeStart === time
        );
        if (filteredSessions.length > 0) {
          result[day] = filteredSessions;
        }
        return result;
      },
      {}
    );

    if (Object.keys(weeklyData).length === 0) {
      return res.status(404).send("No sessions found for the given time.");
    }

    res.send({
      name: trainer.name,
      schedule: weeklyData, // returning the filtered schedule
    });
  } catch (error) {
    console.error("Error fetching trainer's schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Trainer's Weekly Schedule for a Specific Class Type
router.get("/:name/classType/:classType", async (req, res) => {
  const { name, classType } = req.params;

  try {
    // Fetch the trainer's data by name
    const trainer = await Trainers_ScheduleCollection.findOne({ name });

    if (!trainer) {
      return res.status(404).send("Trainer not found.");
    }

    // Filter schedule by classType for each day
    const weeklyData = Object.entries(trainer.scheduleWithPrices).reduce(
      (result, [day, sessions]) => {
        const filteredSessions = sessions.filter(
          (session) => session.classType === classType
        );
        if (filteredSessions.length > 0) {
          result[day] = filteredSessions;
        }
        return result;
      },
      {}
    );

    if (Object.keys(weeklyData).length === 0) {
      return res
        .status(404)
        .send(`No sessions found for class type "${classType}".`);
    }

    res.send({
      name: trainer.name,
      schedule: weeklyData, // returning the filtered schedule
    });
  } catch (error) {
    console.error("Error fetching trainer's schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Trainer_Schedule by Trainer Name
// Get Trainer Schedule by Trainer Name
router.get("/ByTrainerName", async (req, res) => {
  try {
    const { trainerName } = req.query; // Extract the Trainer Name from query parameters

    if (!trainerName || trainerName.trim() === "") {
      return res
        .status(400)
        .json({ error: "Trainer Name query parameter is required." });
    }

    // Create a case-insensitive search query
    const query = {
      trainerName: { $regex: new RegExp(trainerName.trim(), "i") },
    };

    // Fetch trainer schedule
    const result = await Trainers_ScheduleCollection.find(query, {
      projection: { _id: 0, trainerName: 1, schedule: 1 }, // Optional: Select only required fields
    }).toArray();

    if (result.length === 0) {
      return res
        .status(404)
        .json({ error: "Trainer not found or has no schedule." });
    }

    res.status(200).json(result); // Send the fetched trainer schedule
  } catch (error) {
    console.error("Error fetching Trainer Schedule by trainerName:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
