const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Gym_Features
const Gym_FeaturesCollection = client
  .db("Seven-Gym")
  .collection("Gym_Features");

// GET: All Gym Features
router.get("/", async (req, res) => {
  try {
    const result = await Gym_FeaturesCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Gym_Features:", error);
    res.status(500).send("Something went wrong.");
  }
});

// ADD: New Gym Feature
router.post("/", async (req, res) => {
  try {
    const newFeature = req.body;

    // Basic validation
    if (!newFeature.title || !newFeature.description || !newFeature.icon) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Add default 'show' as false if not present
    if (newFeature.show === undefined) {
      newFeature.show = false;
    }

    const result = await Gym_FeaturesCollection.insertOne(newFeature);
    res.status(201).json({
      message: "Feature added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Gym Feature:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT: Update entire Gym Feature
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, show } = req.body;

    // Basic validation
    if (!title || !description || !icon) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const replacementDoc = {
      title,
      description,
      icon,
      show: show === undefined ? false : show, // default to false if not provided
    };

    const result = await Gym_FeaturesCollection.replaceOne(
      { _id: new ObjectId(id) },
      replacementDoc
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Feature not found." });
    }

    res.json({ message: "Feature replaced successfully." });
  } catch (error) {
    console.error("Error replacing Gym Feature:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PATCH : Toggle 'show' field for a feature
router.patch("/ToggleShow/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const feature = await Gym_FeaturesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!feature) {
      return res.status(404).json({ message: "Feature not found" });
    }

    // Default to false if 'show' field doesn't exist
    const newShowValue = !(feature.show === true);

    const updateResult = await Gym_FeaturesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { show: newShowValue } }
    );

    res.send({
      success: true,
      updated: updateResult.modifiedCount > 0,
      show: newShowValue,
    });
  } catch (error) {
    console.error("Error toggling show status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE: A Gym Feature by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Gym_FeaturesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Feature not found." });
    }

    res.json({ message: "Feature deleted successfully." });
  } catch (error) {
    console.error("Error deleting Gym Feature:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
