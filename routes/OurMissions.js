const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Our_Missions
const Our_MissionsCollection = client
  .db("Seven-Gym")
  .collection("Our_Missions");

// Get Our_Missions (as single object)
router.get("/", async (req, res) => {
  try {
    const result = await Our_MissionsCollection.findOne(); 
    if (!result) {
      return res.status(404).send("No mission found.");
    }
    res.send(result);
  } catch (error) {
    console.error("Error fetching Our_Missions:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT: Update Our Mission by _id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: updateData,
    };

    const result = await Our_MissionsCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "No mission found with that ID." });
    }

    res.json({ message: "Mission updated successfully." });
  } catch (error) {
    console.error("Error updating Our_Missions:", error);
    res.status(500).json({ message: "Failed to update mission." });
  }
});

module.exports = router;
