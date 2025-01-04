const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for TierData
const TierDataCollection = client.db("Seven-Gym").collection("TierData");

// Get TierData
router.get("/", async (req, res) => {
  try {
    const result = await TierDataCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching TierData:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get TierData by Name
router.get("/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const result = await TierDataCollection.findOne({ name: name });

    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ message: "Tier not found" });
    }
  } catch (error) {
    console.error("Error fetching TierData by name:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
