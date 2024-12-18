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
