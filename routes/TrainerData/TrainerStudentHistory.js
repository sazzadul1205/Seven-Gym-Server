const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Trainer_Student_History
const Trainer_Student_HistoryCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Student_History");

// Get Trainer_Student_History
router.get("/", async (req, res) => {
  try {
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).send("trainerId is required.");
    }

    const result = await Trainer_Student_HistoryCollection.findOne({
      trainerId: trainerId, // direct match on trainerId field
    });

    if (!result) {
      return res.status(404).send("Trainer history not found.");
    }

    res.send(result);
  } catch (error) {
    console.error(
      "Error fetching Trainer_Student_History by trainerId:",
      error
    );
    res.status(500).send("Something went wrong.");
  }
});

// Add to StudentsHistory array by trainerId
router.post("/", async (req, res) => {
  try {
    const { trainerId, studentEntry } = req.body;

    if (!trainerId || !studentEntry) {
      return res.status(400).send("trainerId and studentEntry are required.");
    }

    const result = await Trainer_Student_HistoryCollection.updateOne(
      { trainerId: trainerId }, // match using string field
      { $push: { StudentsHistory: studentEntry } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send("Trainer not found or update failed.");
    }

    res.send({ message: "Student history added successfully." });
  } catch (error) {
    console.error("Error adding to StudentsHistory:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
