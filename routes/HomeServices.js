const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Home_Services_Section
const Home_Services_SectionCollection = client
  .db("Seven-Gym")
  .collection("Home_Services_Section");

// Get Home_Services_Section
router.get("/", async (req, res) => {
  try {
    const result = await Home_Services_SectionCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Home_Services_Section:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
