const { ObjectId } = require("mongodb");
const { client } = require("../../config/db");
const express = require("express");
const router = express.Router();

// MongoDB collections
const TrainersCollection = client.db("Seven-Gym").collection("Trainers");
const Trainers_ScheduleCollection = client
  .db("Seven-Gym")
  .collection("Trainers_Schedule");

router.get("/", async (req, res) => {
  try {
    const trainers = await TrainersCollection.find({}).toArray();
    const schedules = await Trainers_ScheduleCollection.find({}).toArray();

    const result = [];

    for (const schedule of schedules) {
      const trainerName = schedule.trainerName?.trim().toLowerCase();

      if (!trainerName) continue;

      const matchedTrainer = trainers.find(
        (trainer) => trainer.name.trim().toLowerCase() === trainerName
      );

      if (matchedTrainer) {
        const trainerId = matchedTrainer._id;

        await Trainers_ScheduleCollection.updateOne(
          { _id: schedule._id },
          { $set: { trainerId } }
        );

        result.push({
          trainerName: schedule.trainerName,
          trainerId,
        });
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Sync Error:", err.message);
    res.status(500).json({ error: "Internal server error during sync." });
  }
});

router.put("/normalizeTrainerIds", async (req, res) => {
  try {
    const cursor = Trainers_ScheduleCollection.find({});
    let matchedCount = 0;
    let modifiedCount = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      // Check if trainerId is ObjectId instance (not string)
      if (doc.trainerId && doc.trainerId instanceof ObjectId) {
        matchedCount++;

        // Convert ObjectId to string
        const trainerIdStr = doc.trainerId.toHexString();

        const updateResult = await Trainers_ScheduleCollection.updateOne(
          { _id: doc._id },
          { $set: { trainerId: trainerIdStr } }
        );

        if (updateResult.modifiedCount > 0) modifiedCount++;
      }
    }

    res.status(200).json({
      message: "Trainer IDs normalized successfully.",
      matchedCount,
      modifiedCount,
    });
  } catch (error) {
    console.error("Error normalizing trainer IDs:", error);
    res.status(500).json({ error: "Failed to normalize trainer IDs." });
  }
});

module.exports = router;
