const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Gallery
const GalleryCollection = client
  .db("Seven-Gym")
  .collection("Gallery");

// Get Gallery
router.get("/", async (req, res) => {
  try {
    const result = await GalleryCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Gallery:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
