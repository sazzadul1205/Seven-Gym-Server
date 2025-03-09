const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

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

// Like/Unlike a thread
router.post("/like/:id", async (req, res) => {
  try {
    const { email } = req.body; // Get user email from request body
    const { id } = req.params; // Get thread ID from URL params

    if (!email) {
      return res.status(400).json({ error: "User email is required." });
    }

    const thread = await ForumsCollection.findOne({ _id: new ObjectId(id) });

    if (!thread) {
      return res.status(404).json({ error: "Thread not found." });
    }

    const alreadyLiked = thread.likedBy?.includes(email);

    let updatedThread;
    if (alreadyLiked) {
      // Unlike: Remove email and decrease like count
      updatedThread = await ForumsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $inc: { likes: -1 },
          $pull: { likedBy: email },
        },
        { returnDocument: "after" }
      );
    } else {
      // Like: Add email and increase like count
      updatedThread = await ForumsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $inc: { likes: 1 },
          $addToSet: { likedBy: email },
        },
        { returnDocument: "after" }
      );
    }

    res.json(updatedThread);
  } catch (error) {
    console.error("Error updating like:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
