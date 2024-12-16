const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Feedback
const FeedbackCollection = client.db("Seven-Gym").collection("Feedback");

// Get Feedback
router.get("/", async (req, res) => {
  try {
    const result = await FeedbackCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Feedback:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Add Feedback (POST)
router.post("/", async (req, res) => {
  try {
    const feedback = req.body;
    
    // Insert the feedback into the database
    const result = await FeedbackCollection.insertOne(feedback);

    res.status(201).send({
      success: true,
      message: "Feedback submitted successfully!",
      data: result,
    });
  } catch (error) {
    console.error("Error submitting Feedback:", error);
    res.status(500).send("Failed to submit feedback.");
  }
});

module.exports = router;
