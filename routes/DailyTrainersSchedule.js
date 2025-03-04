const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Daily Trainers Schedule
const Daily_Trainers_ScheduleCollection = client
  .db("Seven-Gym")
  .collection("Daily_Trainers_Schedule");

// Get Daily Trainers Schedule
router.get("/", async (req, res) => {
  try {
    const result = await Daily_Trainers_ScheduleCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Daily Trainers Schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

/**
 * PATCH /updateTrainerClass
 *
 * Expects the request body to be an array of schedule objects.
 * For each object (example):
 * {
 *    "id": "Yoga-Monday-08:00",
 *    "day": "Monday",
 *    "startTime": "08:00",
 *    "endTime": "08:59"
 * }
 *
 * The route extracts the module name from the id (e.g., "Yoga") and sets the classType in each
 * trainer's schedule for the matching day and startTime to "Yoga Class".
 */
router.patch("/updateTrainerClass", async (req, res) => {
  const scheduleUpdates = req.body;

  if (!Array.isArray(scheduleUpdates)) {
    return res
      .status(400)
      .send("Request body must be an array of schedule update objects.");
  }

  try {
    // Process each update request
    const updatePromises = scheduleUpdates.map((item) => {
      const { id, day, startTime } = item;
      if (!id || !day || !startTime) {
        throw new Error(
          "Each schedule update must include id, day, and startTime."
        );
      }

      // Extract the module from the id (e.g., "Yoga" from "Yoga-Monday-08:00")
      const module = id.split("-")[0];
      const newClassType = `${module} Class`;

      // Construct the dot notation path to the nested classType field
      const fieldPath = `trainerSchedule.${day}.${startTime}.classType`;

      // Update all trainer documents that have this time slot
      return Daily_Trainers_ScheduleCollection.updateMany(
        { [fieldPath]: { $exists: true } },
        { $set: { [fieldPath]: newClassType } }
      );
    });

    const updateResults = await Promise.all(updatePromises);
    res.send(updateResults);
  } catch (error) {
    console.error("Error updating trainer schedule:", error);
    res.status(500).send("Error updating trainer schedule");
  }
});

module.exports = router;
