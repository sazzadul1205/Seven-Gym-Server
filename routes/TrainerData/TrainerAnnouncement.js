const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection reference
const TrainerAnnouncementCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Announcement");

// GET: All trainer announcements or filtered by one or more trainerIDs
router.get("/", async (req, res) => {
  try {
    let { trainerID } = req.query;

    // Normalize trainerID to an array if it's provided
    if (trainerID) {
      // If trainerID is already an array (e.g., ?trainerID=1&trainerID=2), use it as is
      // If it's a single string, wrap it in an array
      trainerID = Array.isArray(trainerID) ? trainerID : [trainerID];
    }

    // Build filter
    const filter = trainerID ? { trainerID: { $in: trainerID } } : {};

    const announcements = await TrainerAnnouncementCollection.find(
      filter
    ).toArray();

    // Return a single object if only one result is found
    if (announcements.length === 1) {
      return res.status(200).json(announcements[0]);
    }

    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching trainer announcements:", error);
    res.status(500).json({ message: "Failed to fetch trainer announcements." });
  }
});

// POST : Add new trainer announcement
router.post("/", async (req, res) => {
  try {
    const announcement = req.body;

    if (
      !announcement.title ||
      !announcement.content ||
      !announcement.trainerID
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const result = await TrainerAnnouncementCollection.insertOne(announcement);
    res.status(201).json({
      message: "Announcement added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding trainer announcement:", error);
    res.status(500).json({ message: "Failed to add announcement." });
  }
});

// PUT : Update a trainer announcement by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await TrainerAnnouncementCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    res.status(200).json({ message: "Announcement updated successfully." });
  } catch (error) {
    console.error("Error updating trainer announcement:", error);
    res.status(500).json({ message: "Failed to update announcement." });
  }
});

// DELETE : Remove a trainer announcement by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await TrainerAnnouncementCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    res.status(200).json({ message: "Announcement deleted successfully." });
  } catch (error) {
    console.error("Error deleting trainer announcement:", error);
    res.status(500).json({ message: "Failed to delete announcement." });
  }
});

module.exports = router;
