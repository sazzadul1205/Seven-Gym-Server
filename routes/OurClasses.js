const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Our_Classes
const Our_ClassesCollection = client.db("Seven-Gym").collection("Our_Classes");

// Get Our_Classes
router.get("/", async (req, res) => {
  try {
    const result = await Our_ClassesCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Our_Classes:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
