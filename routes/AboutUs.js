const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for AboutUs
const AboutUsCollection = client.db("Seven-Gym").collection("AboutUs");

// Get AboutUs
router.get("/", async (req, res) => {
  try {
    const result = await AboutUsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching AboutUs:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
