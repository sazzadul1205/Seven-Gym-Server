const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Feedback
const FeedbackCollection = client.db("Seven-Gym").collection("Feedback");

// Get All Feedback
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

// Delete Single Feedback by _id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await FeedbackCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "Feedback not found." });
    }

    res.send({
      success: true,
      message: "Feedback deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).send("Failed to delete feedback.");
  }
});

// Delete Multiple Feedback by Array of _id
router.delete("/", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({ success: false, message: "No IDs provided." });
    }

    const objectIds = ids.map((id) => new ObjectId(id));

    const result = await FeedbackCollection.deleteMany({ _id: { $in: objectIds } });

    res.send({
      success: true,
      message: `${result.deletedCount} feedback item(s) deleted.`,
    });
  } catch (error) {
    console.error("Error deleting multiple feedbacks:", error);
    res.status(500).send("Failed to delete feedbacks.");
  }
});

module.exports = router;
