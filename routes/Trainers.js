const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Trainers
const TrainersCollection = client.db("Seven-Gym").collection("Trainers");

// Get Trainers
router.get("/", async (req, res) => {
  try {
    const result = await TrainersCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainers:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.get("/specializations", async (req, res) => {
  try {
    const result = await TrainersCollection.aggregate([
      {
        $group: {
          _id: "$specialization",
        },
      },
      {
        $project: {
          _id: 0,
          specialization: "$_id",
        },
      },
    ]).toArray();
    res.send(result.map((item) => item.specialization));
  } catch (error) {
    console.error("Error fetching specializations:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.get("/tiers", async (req, res) => {
  try {
    const result = await TrainersCollection.aggregate([
      {
        $group: {
          _id: "$tier", // Group by the tier field
        },
      },
      {
        $project: {
          _id: 0, // Remove _id from the result
          tier: "$_id", // Rename _id to tier
        },
      },
    ]).toArray();

    // Send the distinct tiers as a response
    res.send(result.map((item) => item.tier));
  } catch (error) {
    console.error("Error fetching tiers:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
