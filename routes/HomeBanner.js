const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Home_Banner_Section
const Home_Banner_SectionCollection = client
  .db("Seven-Gym")
  .collection("Home_Banner_Section");

// Get Home_Banner_Section
router.get("/", async (req, res) => {
  try {
    const result = await Home_Banner_SectionCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Home_Banner_Section:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
