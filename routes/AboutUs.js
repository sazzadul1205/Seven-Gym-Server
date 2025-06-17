const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for AboutUs
const AboutUsCollection = client.db("Seven-Gym").collection("AboutUs");

// Get AboutUs
router.get("/", async (req, res) => {
  try {
    const result = await AboutUsCollection.findOne();
    if (!result) {
      return res.status(404).send("No About Us found.");
    }
    res.send(result);
  } catch (error) {
    console.error("Error fetching AboutUs:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PATCH : Add new Mission Vision Value
router.patch("/AddMissionVisionValue", async (req, res) => {
  try {
    const newItem = req.body;

    if (!newItem?.title || !newItem?.description || !newItem?.image) {
      return res.status(400).send("Missing title, description, or image.");
    }

    // Attach custom ID (optional but recommended)
    newItem.id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const updated = await AboutUsCollection.findOneAndUpdate(
      {},
      { $push: { missionVisionValues: newItem } },
      { new: true }
    );

    if (!updated) return res.status(404).send("No About Us document found.");
    res.status(200).send(updated.missionVisionValues);
  } catch (error) {
    console.error("Error Adding Mission Vision Value:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PATCH : Add new Add Feature
router.patch("/AddFeature", async (req, res) => {
  try {
    const newFeature = req.body;

    if (!newFeature?.title || !newFeature?.description || !newFeature?.image) {
      return res.status(400).send("Missing title, description, or image.");
    }

    // Attach custom ID (optional but recommended)
    newFeature.id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const updated = await AboutUsCollection.findOneAndUpdate(
      {},
      { $push: { features: newFeature } },
      { new: true }
    );

    if (!updated) return res.status(404).send("No About Us document found.");
    res.status(200).send(updated.features);
  } catch (error) {
    console.error("Error Adding Feature:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PATCH : Add new Team Members
router.patch("/AddTeamMember", async (req, res) => {
  try {
    const newMember = req.body;

    if (
      !newMember?.name ||
      !newMember?.role ||
      !newMember?.image ||
      !newMember?.socials
    ) {
      return res
        .status(400)
        .send("Missing name, role, image, or socials object.");
    }

    // Attach custom ID (optional but recommended)
    newMember.id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const updated = await AboutUsCollection.findOneAndUpdate(
      {},
      { $push: { teamMembers: newMember } },
      { new: true }
    );

    if (!updated) return res.status(404).send("No About Us document found.");
    res.status(200).send(updated.teamMembers);
  } catch (error) {
    console.error("Error adding team member:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PATCH : Delete a Mission Vision Value by Id
router.patch("/DeleteMissionVisionValue/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await AboutUsCollection.findOneAndUpdate(
      {},
      { $pull: { missionVisionValues: { id } } },
      { new: true }
    );

    if (!updated) return res.status(404).send("No About Us document found.");

    res.status(200).send(updated.missionVisionValues);
  } catch (error) {
    console.error("Error deleting mission vision value:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PATCH : Delete a Features by Id
router.patch("/DeleteFeature/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await AboutUsCollection.findOneAndUpdate(
      {},
      { $pull: { features: { id } } },
      { new: true }
    );

    if (!updated) return res.status(404).send("No About Us document found.");

    res.status(200).send(updated.features);
  } catch (error) {
    console.error("Error deleting feature:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PATCH : Delete a Team by Id
router.patch("/DeleteTeamMember/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await AboutUsCollection.findOneAndUpdate(
      {},
      { $pull: { teamMembers: { id } } },
      { new: true }
    );

    if (!updated) return res.status(404).send("No About Us document found.");

    res.status(200).send(updated.teamMembers);
  } catch (error) {
    console.error("Error deleting team member:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT: Update About Us by _id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: updateData,
    };

    const result = await AboutUsCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "No About Us Found with that ID." });
    }

    res.json({ message: "About Us Updated Successfully." });
  } catch (error) {
    console.error("Error updating About Us:", error);
    res.status(500).json({ message: "Failed to update About Us." });
  }
});

module.exports = router;
