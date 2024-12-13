const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Class_Details
const Class_DetailsCollection = client
  .db("Seven-Gym")
  .collection("Class_Details");

// Get Class_Details
router.get("/", async (req, res) => {
  try {
    const result = await Class_DetailsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Class_Details:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
