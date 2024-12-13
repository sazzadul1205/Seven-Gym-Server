const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Home_Welcome_Section
const Home_Welcome_SectionCollection = client
  .db("Seven-Gym")
  .collection("Home_Welcome_Section");

// Get Home_Welcome_Section
router.get("/", async (req, res) => {
  try {
    const result = await Home_Welcome_SectionCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Home_Welcome_Section:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
