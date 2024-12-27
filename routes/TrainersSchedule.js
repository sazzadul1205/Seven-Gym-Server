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

    const weeklyData = Object.entries(trainer.schedule).reduce(
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
      schedule: weeklyData,
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
    const weeklyData = Object.entries(trainer.schedule).reduce(
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
      schedule: weeklyData,
    });
  } catch (error) {
    console.error("Error fetching trainer's schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Trainer_Schedule by name
router.get("/byName", async (req, res) => {
  const { name } = req.query; // Extract the name from the query parameters

  if (!name) {
    return res.status(400).send("Name query parameter is required.");
  }

  try {
    const result = await Trainers_ScheduleCollection.find({ name }).toArray(); // Filter by name
    if (result.length === 0) {
      return res.status(404).send("Trainer not found.");
    }
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Schedule by name:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.get("/searchTimeAndType", async (req, res) => {
  const { name, timeStart, classType } = req.query;

  try {
    // Find trainers by name
    const trainers = await Trainers_ScheduleCollection.find({
      name: name,
    }).toArray();

    if (!trainers.length) {
      return res.status(404).send("Trainer not found.");
    }

    const result = trainers.map((trainer) => {
      const filteredSchedule = {};

      for (const [day, sessions] of Object.entries(trainer.schedule)) {
        // Filter sessions based on timeStart and optionally classType
        const matchedSessions = sessions.filter((session) => {
          const matchesTime = timeStart
            ? session.timeStart === timeStart
            : true;
          const matchesType = classType
            ? session.classType === classType
            : true;
          return matchesTime && matchesType;
        });

        if (matchedSessions.length > 0) {
          filteredSchedule[day] = matchedSessions;
        }
      }

      return {
        name: trainer.name,
        schedule: filteredSchedule,
      };
    });

    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainers_Schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST: Add new trainer schedules (array of schedules)
router.post("/", async (req, res) => {
  try {
    const trainerSchedules = req.body;

    // Check if the trainerSchedules array is valid and not empty
    if (!Array.isArray(trainerSchedules) || trainerSchedules.length === 0) {
      return res
        .status(400)
        .send("Invalid data. An array of trainer schedules is required.");
    }

    // Loop through the trainerSchedules array and ensure each schedule is well-formed
    trainerSchedules.forEach((trainerSchedule) => {
      if (!trainerSchedule.name || !trainerSchedule.schedule) {
        throw new Error("Each schedule must have a 'name' and 'schedule'.");
      }

      // Loop through the schedule for each day and ensure it is well-formed
      Object.keys(trainerSchedule.schedule).forEach((day) => {
        if (!Array.isArray(trainerSchedule.schedule[day])) {
          trainerSchedule.schedule[day] = []; // Initialize as an empty array if undefined
        }
      });
    });

    // Insert each schedule into the database
    const result = await Trainers_ScheduleCollection.insertMany(
      trainerSchedules
    );

    res
      .status(201)
      .send(`${result.insertedCount} trainer schedule(s) added successfully.`);
  } catch (error) {
    console.error("Error adding trainer schedules:", error);
    res
      .status(500)
      .send("Something went wrong while adding the trainer schedules.");
  }
});

module.exports = router;
