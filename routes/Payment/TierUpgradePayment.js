const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Tier_Upgrade_Payment
const Tier_Upgrade_PaymentCollection = client
  .db("Seven-Gym")
  .collection("Tier_Upgrade_Payment");

// Get Tier_Upgrade_Payment with optional filters
router.get("/", async (req, res) => {
  try {
    const { _id, email, tier, duration, paymentID, stripePaymentID } =
      req.query;

    const query = {};

    if (_id) {
      try {
        query._id = new ObjectId(_id);
      } catch (err) {
        return res.status(400).send("Invalid _id format");
      }
    }
    if (email) {
      query.email = email;
    }
    if (tier) {
      query.tier = tier;
    }
    if (duration) {
      query.duration = duration;
    }
    if (paymentID) {
      query.paymentID = paymentID;
    }
    if (stripePaymentID) {
      query.stripePaymentID = stripePaymentID;
    }

    // If query is empty, fetch all
    const result = await Tier_Upgrade_PaymentCollection.find(
      Object.keys(query).length ? query : {}
    ).toArray();

    res.status(200).send(result);
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
