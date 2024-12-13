const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Promotions
const PromotionsCollection = client.db("Seven-Gym").collection("Promotions");

// Get Promotions
router.get("/", async (req, res) => {
  try {
    const result = await PromotionsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Promotions:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
