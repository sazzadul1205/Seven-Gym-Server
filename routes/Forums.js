const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Forums
const ForumsCollection = client.db("Seven-Gym").collection("Forums");

// Get Forums
router.get("/", async (req, res) => {
  try {
    const result = await ForumsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Forums:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.get("/categories", async (req, res) => {
  try {
    const result = await ForumsCollection.aggregate([
      {
        $group: {
          _id: "$category", // Group by the category field
        },
      },
      {
        $project: {
          _id: 0, // Remove _id from the result
          category: "$_id", // Rename _id to category
        },
      },
    ]).toArray();

    // Send the distinct categories as a response
    res.send(result.map((item) => item.category));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
