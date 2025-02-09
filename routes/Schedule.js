const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Schedule
const ScheduleCollection = client.db("Seven-Gym").collection("Schedule");

// Get Schedule
router.get("/", async (req, res) => {
  try {
    const result = await ScheduleCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
