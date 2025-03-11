const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Forums
const ForumsCollection = client.db("Seven-Gym").collection("Forums");

// Get Forums
router.get("/", async (req, res) => {
  try {
    const result = await ForumsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Forums:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.get("/categories", async (req, res) => {
  try {
    const result = await ForumsCollection.aggregate([
      {
        $group: {
          _id: "$category", // Group by the category field
        },
      },
      {
        $project: {
          _id: 0, // Remove _id from the result
          category: "$_id", // Rename _id to category
        },
      },
    ]).toArray();

    // Send the distinct categories as a response
    res.send(result.map((item) => item.category));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Add Comment to a Forum Post
router.post("/:id/comment", async (req, res) => {
  const { id } = req.params;
  const { name, email, comment, commentedAt } = req.body;

  if (!name || !email || !comment) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const updatedThread = await ForumsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) }, // Ensure to import ObjectId from "mongodb"
      { $push: { comments: { name, email, comment, commentedAt } } },
      { returnDocument: "after" }
    );

    if (!updatedThread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res
      .status(200)
      .json({ message: "Comment added successfully", updatedThread });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
