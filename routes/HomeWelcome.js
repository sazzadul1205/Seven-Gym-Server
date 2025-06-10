const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Home_Welcome_Section
const Home_Welcome_SectionCollection = client
  .db("Seven-Gym")
  .collection("Home_Welcome_Section");

// Get : Home Welcome Section Data
router.get("/", async (req, res) => {
  try {
    const result = await Home_Welcome_SectionCollection.find().toArray();

    if (result.length === 1) {
      res.send(result[0]);
    } else {
      res.send(result);
    }
  } catch (error) {
    console.error("Error fetching Home_Welcome_Section:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT: Update Home Welcome Section by ID
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const { title, description, videoUrl } = req.body;

  try {
    const updateResult = await Home_Welcome_SectionCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          description,
          videoUrl,
        },
      }
    );

    if (updateResult.modifiedCount === 1) {
      res.send({ message: "Update successful." });
    } else {
      res
        .status(404)
        .send({ message: "Document not found or no changes made." });
    }
  } catch (error) {
    console.error("Error updating Home_Welcome_Section:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
