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

    let result;

    if (trainerId) {
      // Fetch specific trainer history
      result = await Trainer_Student_HistoryCollection.findOne({
        trainerId: trainerId,
      });

      if (!result) {
        return res.status(404).send("Trainer history not found.");
      }
    } else {
      // Fetch all trainer histories
      result = await Trainer_Student_HistoryCollection.find({}).toArray();
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
    const { trainerId, studentEntry } = req.body;

    if (!trainerId || !studentEntry || !studentEntry.bookerEmail) {
      return res
        .status(400)
        .send("trainerId, studentEntry, and bookerEmail are required.");
    }

    // Check if student with the given email already exists in the StudentsHistory array
    const result = await Trainer_Student_HistoryCollection.updateOne(
      {
        trainerId: trainerId,
        "StudentsHistory.bookerEmail": studentEntry.bookerEmail, // Check if email exists
      },
      {
        $set: {
          "StudentsHistory.$.ActiveTime": studentEntry.ActiveTime, // Update ActiveTime
        },
      }
    );

    if (result.matchedCount === 0) {
      // If no matching email was found, add the new entry
      const addResult = await Trainer_Student_HistoryCollection.updateOne(
        { trainerId: trainerId },
        { $push: { StudentsHistory: studentEntry } }
      );

      if (addResult.modifiedCount === 0) {
        return res
          .status(400)
          .send("Trainer found but student entry was not added.");
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
