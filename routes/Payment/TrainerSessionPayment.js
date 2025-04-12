const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Trainer_Session_Payment
const Trainer_Session_PaymentCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Session_Payment");

// Get Trainer_Session_Payment
router.get("/", async (req, res) => {
  try {
    const result = await Trainer_Session_PaymentCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Session_Payment:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST Trainer_Session_Payment
router.post("/", async (req, res) => {
  try {
    const paymentData = req.body;

    // Insert data directly into the collection
    const result = await Trainer_Session_PaymentCollection.insertOne(
      paymentData
    );

    res.status(201).send({
      message: "Payment record added successfully.",
      paymentId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Trainer_Session_Payment:", error);
    res.status(500).send("Something went wrong.");
  }
});
