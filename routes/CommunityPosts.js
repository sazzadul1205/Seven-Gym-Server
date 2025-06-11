const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();
const { client } = require("../config/db");

// Collection for CommunityPosts
const CommunityPostsCollection = client
  .db("Seven-Gym")
  .collection("CommunityPosts");

// GET all community posts
router.get("/", async (req, res) => {
  try {
    const posts = await CommunityPostsCollection.find().toArray();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching community posts:", error);
    res.status(500).json({ message: "Failed to fetch community posts" });
  }
});

// POST a new community post
router.post("/", async (req, res) => {
  try {
    const newPost = req.body;
    const result = await CommunityPostsCollection.insertOne(newPost);
    res.status(201).json({ message: "Post added", postId: result.insertedId });
  } catch (error) {
    console.error("Error adding community post:", error);
    res.status(500).json({ message: "Failed to add community post" });
  }
});

// PATCH like or dislike a post
router.patch("/react/:id", async (req, res) => {
  const { type, email } = req.body; // type: 'like' or 'dislike'
  const postId = req.params.id;

  if (!email || !["like", "dislike"].includes(type)) {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    const post = await CommunityPostsCollection.findOne({
      _id: new ObjectId(postId),
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    const oppositeField = type === "like" ? "disliked" : "liked";
    const currentField = type === "like" ? "liked" : "disliked";

    const update = {};

    // Remove email from opposite field if it exists
    if (post[oppositeField]?.includes(email)) {
      update.$pull = { [oppositeField]: email };
    }

    // Add email to current field if it doesn't exist
    if (!post[currentField]?.includes(email)) {
      if (!update.$addToSet) update.$addToSet = {};
      update.$addToSet[currentField] = email;
    }

    const result = await CommunityPostsCollection.updateOne(
      { _id: new ObjectId(postId) },
      update
    );

    res.status(200).json({ message: "Reaction updated", result });
  } catch (error) {
    console.error("Error updating reaction:", error);
    res.status(500).json({ message: "Failed to update reaction" });
  }
});

// DELETE a post by ID
router.delete("/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const result = await CommunityPostsCollection.deleteOne({
      _id: new ObjectId(postId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    console.error("Error deleting community post:", error);
    res.status(500).json({ message: "Failed to delete community post" });
  }
});

module.exports = router;
