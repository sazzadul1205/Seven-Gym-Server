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

// Like a thread: add email to likedBy and increment likes
router.patch("/:id/like", async (req, res) => {
  try {
    const { email } = req.body;
    const threadId = req.params.id;
    const update = {
      $inc: { likes: 1 },
      $addToSet: { likedBy: email }, // add email if not already present
    };

    const updatedThread = await ForumsCollection.findOneAndUpdate(
      { _id: new ObjectId(threadId) },
      update,
      { returnDocument: "after" }
    );

    res.send(updatedThread.value);
  } catch (error) {
    console.error("Error liking thread:", error);
    res.status(500).send("Error liking thread.");
  }
});

// Unlike a thread: remove email from likedBy and decrement likes
router.patch("/:id/unlike", async (req, res) => {
  try {
    const { email } = req.body;
    const threadId = req.params.id;
    const update = {
      $inc: { likes: -1 },
      $pull: { likedBy: email }, // remove email from array
    };

    const updatedThread = await ForumsCollection.findOneAndUpdate(
      { _id: new ObjectId(threadId) },
      update,
      { returnDocument: "after" }
    );

    res.send(updatedThread.value);
  } catch (error) {
    console.error("Error un-liking thread:", error);
    res.status(500).send("Error un-liking thread.");
  }
});

module.exports = router;
