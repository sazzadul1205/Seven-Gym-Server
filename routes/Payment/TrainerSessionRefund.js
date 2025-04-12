const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Trainer_Session_Refund
const Trainer_Session_RefundCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Session_Refund");

// Get Trainer_Session_Refund
router.get("/", async (req, res) => {
  try {
    const result = await Trainer_Session_RefundCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Session_Refund:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST Trainer_Session_Refund
router.post("/", async (req, res) => {
  try {
    const paymentData = req.body;

    // Insert data directly into the collection
    const result = await Trainer_Session_RefundCollection.insertOne(
      paymentData
    );

    res.status(201).send({
      message: "Refund record added successfully.",
      paymentId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Trainer_Session_Refund:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
