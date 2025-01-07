const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Tier_Upgrade_Payment
const Tier_Upgrade_PaymentCollection = client
  .db("Seven-Gym")
  .collection("Tier_Upgrade_Payment");

// Get Tier_Upgrade_Payment
router.get("/", async (req, res) => {
  try {
    const result = await Tier_Upgrade_PaymentCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Tier_Upgrade_Payment:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST Tier_Upgrade_Payment
router.post("/", async (req, res) => {
  try {
    const paymentData = req.body;

    // Insert data directly into the collection
    const result = await Tier_Upgrade_PaymentCollection.insertOne(paymentData);

    res.status(201).send({
      message: "Payment record added successfully.",
      paymentId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Tier_Upgrade_Payment:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Query by paymentID, email, paymentMethod, or tier
router.get("/search", async (req, res) => {
  try {
    // Extract query parameters
    const { paymentID, email, paymentMethod, tier } = req.query;

    // Build the query object dynamically based on provided parameters
    const query = {};
    if (paymentID) query.paymentID = paymentID;
    if (email) query.email = email;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (tier) query.tier = tier;

    // Execute the query
    const result = await Tier_Upgrade_PaymentCollection.find(query).toArray();

    if (result.length > 0) {
      res.status(200).send(result);
    } else {
      res.status(404).send({
        message: "No records found matching the query.",
        query: query,
      });
    }
  } catch (error) {
    console.error("Error querying Tier_Upgrade_Payment:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
