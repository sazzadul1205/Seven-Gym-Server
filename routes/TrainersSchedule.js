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

module.exports = router;
