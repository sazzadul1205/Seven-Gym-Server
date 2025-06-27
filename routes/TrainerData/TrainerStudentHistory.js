const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Trainer_Student_History
const Trainer_Student_HistoryCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Student_History");

// Get Trainer_Student_History (query by trainerId and/or name)
router.get("/", async (req, res) => {
  try {
    const { trainerId, name } = req.query;

    const filter = {};

    if (trainerId) {
      filter.trainerId = {
        $in: [trainerId.trim(), new ObjectId(trainerId.trim())],
      };
    }

    if (name) {
      filter.name = name.trim();
    }

    const result = await Trainer_Student_HistoryCollection.find(
      filter
    ).toArray();

    if (!result.length) {
      return res.status(404).send("No matching trainer history found.");
    }

    // Send object if single result, otherwise send array
    if (result.length === 1) {
      return res.send(result[0]);
    }

    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Student_History:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.get("/ByBooker", async (req, res) => {
  try {
    const { bookerEmail } = req.query;

    if (!bookerEmail) {
      return res.status(400).send("Missing required parameter: bookerEmail");
    }

    const result = await Trainer_Student_HistoryCollection.find({
      StudentsHistory: {
        $elemMatch: { bookerEmail },
      },
    })
      .project({ trainerId: 1, name: 1, _id: 0 })
      .toArray();

    if (!result || result.length === 0) {
      return res.status(404).send("No trainers found for this student.");
    }

    res.send(result);
  } catch (error) {
    console.error("Error fetching trainers by student email:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Add or update StudentsHistory array by trainerId
router.post("/", async (req, res) => {
  try {
    const { trainerId, studentEntry, trainer } = req.body; // trainer is a string here

    if (!trainerId || !studentEntry || !studentEntry.bookerEmail) {
      return res
        .status(400)
        .send("trainerId, studentEntry, and bookerEmail are required.");
    }

    const trainerIdString = String(trainerId);

    if (!ObjectId.isValid(trainerIdString)) {
      return res.status(400).send("Invalid trainerId format.");
    }

    const trainerObjectId = new ObjectId(trainerIdString);

    // Try to update student ActiveTime if email exists in StudentsHistory
    const result = await Trainer_Student_HistoryCollection.updateOne(
      {
        trainerId: trainerObjectId,
        "StudentsHistory.bookerEmail": studentEntry.bookerEmail,
      },
      {
        $set: {
          "StudentsHistory.$.ActiveTime": studentEntry.ActiveTime,
        },
      }
    );

    if (result.matchedCount === 0) {
      // If no student entry updated, try to push studentEntry to StudentsHistory
      const addResult = await Trainer_Student_HistoryCollection.updateOne(
        { trainerId: trainerObjectId },
        { $push: { StudentsHistory: studentEntry } }
      );

      if (addResult.modifiedCount === 0) {
        // Trainer document does not exist, so create a new one with the specified format
        const insertResult = await Trainer_Student_HistoryCollection.insertOne({
          trainerId: trainerObjectId,
          name: trainer ?? null, // <-- Use the string trainer or null if undefined
          StudentsHistory: [studentEntry],
        });

        if (!insertResult.acknowledged) {
          return res
            .status(500)
            .send("Failed to create new trainer history document.");
        }

        return res.send({
          message:
            "Trainer history document created and student history added.",
        });
      }

      return res.send({ message: "Student history added successfully." });
    }

    res.send({ message: "Student history updated successfully." });
  } catch (error) {
    console.error("Error adding or updating StudentsHistory:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Delete all trainer-student history records
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Trainer_Student_HistoryCollection.deleteMany({});

    res.send({
      message: "All trainer-student history records deleted.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all trainer-student history records:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
