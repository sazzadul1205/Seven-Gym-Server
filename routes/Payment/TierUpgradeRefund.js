const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Tier_Upgrade_Refund
const Tier_Upgrade_RefundCollection = client
  .db("Seven-Gym")
  .collection("Tier_Upgrade_Refund");

// Get Tier_Upgrade_Refund
router.get("/", async (req, res) => {
  try {
    const result = await Tier_Upgrade_RefundCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Tier_Upgrade_Refund:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST Tier_Upgrade_Refund
router.post("/", async (req, res) => {
  try {
    const paymentData = req.body;

    // Insert data directly into the collection
    const result = await Tier_Upgrade_RefundCollection.insertOne(paymentData);

    res.status(201).send({
      message: "Payment record added successfully.",
      paymentId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Tier_Upgrade_Refund:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
