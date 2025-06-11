const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Gallery
const GalleryCollection = client.db("Seven-Gym").collection("Gallery");

// GET: Get all Gallery Data
router.get("/", async (req, res) => {
  try {
    const result = await GalleryCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Gallery:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST: Add a new image to the gallery
router.post("/", async (req, res) => {
  try {
    const { url, alt } = req.body;

    if (!url) {
      return res.status(400).send("Image URL is required.");
    }

    const newImage = {
      url,
      alt: alt || "Gallery Image",
      createdAt: new Date(),
    };

    const result = await GalleryCollection.insertOne(newImage);
    res.status(201).send({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error adding image to Gallery:", error);
    res.status(500).send("Failed to add image.");
  }
});

// DELETE: Remove image by ID
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send("Invalid ID.");
    }

    const result = await GalleryCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send("Image not found.");
    }

    res.send({ deletedId: id });
  } catch (error) {
    console.error("Error deleting image from Gallery:", error);
    res.status(500).send("Failed to delete image.");
  }
});

module.exports = router;
