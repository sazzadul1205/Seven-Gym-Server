const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Home_Services_Section
const Home_Services_SectionCollection = client
  .db("Seven-Gym")
  .collection("Home_Services_Section");

// GET: Fetch all services
router.get("/", async (req, res) => {
  try {
    const result = await Home_Services_SectionCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Home_Services_Section:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST: Add a new service
router.post("/", async (req, res) => {
  try {
    const newService = req.body;

    if (!newService || !newService.title || !newService.description) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const result = await Home_Services_SectionCollection.insertOne(newService);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding Home_Services_Section item:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT: Update a service by ID
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedService = req.body;

    if (
      !updatedService ||
      !updatedService.title ||
      !updatedService.description
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const result = await Home_Services_SectionCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedService }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Service not found." });
    }

    res.json({ message: "Service updated successfully.", result });
  } catch (error) {
    console.error("Error updating Home_Services_Section item:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE: Remove a service by ID
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Home_Services_SectionCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Service not found." });
    }

    res.json({ message: "Service deleted successfully." });
  } catch (error) {
    console.error("Error deleting Home_Services_Section item:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
