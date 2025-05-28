const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Tier_Upgrade_Refund
const Tier_Upgrade_RefundCollection = client
  .db("Seven-Gym")
  .collection("Tier_Upgrade_Refund");

// Get Tier_Upgrade_Refund with optional filters
router.get("/", async (req, res) => {
  try {
    const { _id, email, RefundID, linkedPaymentReceptID } = req.query;

    const query = {};

    if (_id) {
      try {
        query._id = new ObjectId(_id);
      } catch {
        return res.status(400).send("Invalid _id format.");
      }
    }

    if (email) {
      query.email = email;
    }

    if (RefundID) {
      query.RefundID = RefundID;
    }

    if (linkedPaymentReceptID) {
      query.linkedPaymentReceptID = linkedPaymentReceptID;
    }

    const result = await Tier_Upgrade_RefundCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Tier_Upgrade_Refund:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Search Tier_Upgrade_Refund by RefundID, _id, or email
router.get("/search", async (req, res) => {
  try {
    const { refundID, _id, email } = req.query;

    // Build the query object dynamically
    if (refundID) query.RefundID = refundID;
    if (_id) query._id = ObjectId(_id);
    if (email) query.email = email;

    // Execute the query
    const result = await Tier_Upgrade_RefundCollection.find(query).toArray();

    if (result.length === 1) {
      res.status(200).send(result[0]); // Send the single object
    } else if (result.length > 1) {
      res.status(200).send(result); // Send array if multiple
    } else {
      res.status(404).send({
        message: "No records found matching the query.",
        query: query,
      });
    }
  } catch (error) {
    console.error("Error searching Tier_Upgrade_Refund:", error);
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

// DELETE : all Tier_Upgrade_Payment records (Use with caution!)
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Tier_Upgrade_RefundCollection.deleteMany({});

    res.status(200).send({
      message: "All Tier Upgrade Refund records have been deleted.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error Deleting all Tier_Upgrade_Refund records:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
