const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Our_Missions
const Our_MissionsCollection = client.db("Seven-Gym").collection("Our_Missions");

// Get Our_Missions
router.get("/", async (req, res) => {
  try {
    const result = await Our_MissionsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Our_Missions:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
