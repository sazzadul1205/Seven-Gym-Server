const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();
const { client } = require("../config/db");

// Collection for CommunityPosts
const CommunityPostsCollection = client
  .db("Seven-Gym")
  .collection("CommunityPosts");

// GET : All Community posts
router.get("/", async (req, res) => {
  try {
    const posts = await CommunityPostsCollection.find().toArray();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching community posts:", error);
    res.status(500).json({ message: "Failed to fetch community posts" });
  }
});

// POST: Add a new Community post
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

// PATCH : Toggle Like
router.patch("/Post/Like/:postId", async (req, res) => {
  const { postId } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    const post = await CommunityPostsCollection.findOne({
      _id: new ObjectId(postId),
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const likedSet = new Set(post.liked || []);

    if (likedSet.has(email)) {
      likedSet.delete(email);
    } else {
      likedSet.add(email);
    }

    await CommunityPostsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $set: { liked: Array.from(likedSet) } }
    );

    const updatedPost = await CommunityPostsCollection.findOne({
      _id: new ObjectId(postId),
    });
    res.status(200).json({ message: "Like toggled", post: updatedPost });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
});

// PATCH : Toggle Dislike
router.patch("/Post/Dislike/:postId", async (req, res) => {
  const { postId } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    const post = await CommunityPostsCollection.findOne({
      _id: new ObjectId(postId),
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const dislikedSet = new Set(post.disliked || []);

    if (dislikedSet.has(email)) {
      dislikedSet.delete(email);
    } else {
      dislikedSet.add(email);
    }

    await CommunityPostsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $set: { disliked: Array.from(dislikedSet) } }
    );

    const updatedPost = await CommunityPostsCollection.findOne({
      _id: new ObjectId(postId),
    });
    res.status(200).json({ message: "Dislike toggled", post: updatedPost });
  } catch (error) {
    console.error("Error toggling dislike:", error);
    res.status(500).json({ message: "Failed to toggle dislike" });
  }
});

// PATCH: Update a specific post by ID
router.patch("/:id", async (req, res) => {
  const postId = req.params.id;
  const updatedData = req.body;

  if (!ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  try {
    const filter = { _id: new ObjectId(postId) };
    const updateDoc = {
      $set: {
        postTitle: updatedData.postTitle,
        postContent: updatedData.postContent,
        tags: updatedData.tags || [],
        updatedAt: new Date().toISOString(), // Optional: Add timestamp
      },
    };

    const result = await CommunityPostsCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Failed to update community post" });
  }
});

// POST: Add a comment to a community post
router.post("/Post/Comment/:postId", async (req, res) => {
  const { postId } = req.params;
  const comment = req.body;

  if (!postId || !comment?.user || !comment?.content) {
    return res.status(400).json({ message: "Missing required comment data." });
  }

  try {
    const result = await CommunityPostsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $push: { comments: comment } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Comment added successfully." });
    } else {
      res.status(404).json({ message: "Post not found or no change made." });
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment." });
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

// DELETE: Remove a comment from a post by _id and user email
router.delete("/Post/Comments/:id", async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  try {
    const result = await CommunityPostsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: {
          comments: { email: email },
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Comment not found or already deleted" });
    }

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

module.exports = router;
