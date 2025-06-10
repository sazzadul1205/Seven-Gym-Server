const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Home_Banner_Section
const Home_Banner_SectionCollection = client
  .db("Seven-Gym")
  .collection("Home_Banner_Section");

// GET: Fetch all banners
router.get("/", async (req, res) => {
  try {
    const result = await Home_Banner_SectionCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Home_Banner_Section:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST: Add a new banner
router.post("/", async (req, res) => {
  try {
    const newBanner = req.body;

    // Basic validation
    const requiredFields = [
      "title",
      "description",
      "buttonName",
      "link",
      "image",
    ];
    for (let field of requiredFields) {
      if (!newBanner[field]) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    const result = await Home_Banner_SectionCollection.insertOne(newBanner);
    res.status(201).json({
      message: "Banner added successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding new banner:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT: Update a banner by Id
router.put("/:id", async (req, res) => {
  try {
    const bannerId = req.params.id;
    const updateData = req.body;

    // Basic validation (you can adjust this as needed)
    const requiredFields = [
      "title",
      "description",
      "buttonName",
      "link",
      "image",
    ];
    for (let field of requiredFields) {
      if (!updateData[field]) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    const result = await Home_Banner_SectionCollection.updateOne(
      { _id: new ObjectId(bannerId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Banner not found." });
    }

    res.json({ message: "Banner updated successfully." });
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).send("Update failed.");
  }
});

// DELETE: Delete a banner by Id
router.delete("/:id", async (req, res) => {
  try {
    const result = await Home_Banner_SectionCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result);
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).send("Deletion failed.");
  }
});

module.exports = router;
