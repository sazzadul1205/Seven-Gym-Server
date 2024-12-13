const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Gym_Features
const Gym_FeaturesCollection = client
  .db("Seven-Gym")
  .collection("Gym_Features");

// Get Gym_Features
router.get("/", async (req, res) => {
  try {
    const result = await Gym_FeaturesCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Gym_Features:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
