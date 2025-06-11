const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Promotions
const PromotionsCollection = client.db("Seven-Gym").collection("Promotions");

// GET : All Promotions
router.get("/", async (req, res) => {
  try {
    const promotions = await PromotionsCollection.find({}).toArray();
    res.status(200).send(promotions);
  } catch (error) {
    console.error("Error fetching promotions:", error);
    res.status(500).send("Something went wrong while fetching promotions.");
  }
});

// POST : New Promotion
router.post("/", async (req, res) => {
  try {
    const newPromotion = req.body;

    // Basic validation
    if (!newPromotion || Object.keys(newPromotion).length === 0) {
      return res.status(400).send("Promotion data is required");
    }

    const result = await PromotionsCollection.insertOne(newPromotion);
    res.status(201).send({
      message: "Promotion added successfully",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Promotion:", error);
    res.status(500).send("Something went wrong while adding the promotion.");
  }
});

// PUT : Update Promotion by ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const result = await PromotionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send("Promotion not found.");
    }

    res.status(200).send("Promotion updated successfully.");
  } catch (error) {
    console.error("Error updating promotion:", error);
    res.status(500).send("Something went wrong while updating the promotion.");
  }
});

// Toggle Promotion show status
router.patch("/ToggleShow/:id", async (req, res) => {
  try {
    const promotionId = req.params.id;

    // Validate ID format
    if (!ObjectId.isValid(promotionId)) {
      return res.status(400).send("Invalid Promotion ID format");
    }

    // First find the current promotion to get its show status
    const currentPromotion = await PromotionsCollection.findOne({
      _id: new ObjectId(promotionId),
    });

    if (!currentPromotion) {
      return res.status(404).send("Promotion not found");
    }

    // Toggle the show status
    const newShowStatus = !currentPromotion.show;

    // Update the promotion
    const result = await PromotionsCollection.updateOne(
      { _id: new ObjectId(promotionId) },
      { $set: { show: newShowStatus } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).send("Failed to update promotion");
    }

    res.send({
      success: true,
      message: `Promotion ${newShowStatus ? "shown" : "hidden"} successfully`,
      newStatus: newShowStatus,
    });
  } catch (error) {
    console.error("Error toggling Promotion show status:", error);
    res.status(500).send("Something went wrong while updating the promotion.");
  }
});

// DELETE : Delete Promotion
router.delete("/:id", async (req, res) => {
  try {
    const promotionId = req.params.id;

    // Validate ID format
    if (!ObjectId.isValid(promotionId)) {
      return res.status(400).send("Invalid Promotion ID format");
    }

    const result = await PromotionsCollection.deleteOne({
      _id: new ObjectId(promotionId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send("Promotion not found");
    }

    res.send({ message: "Promotion deleted successfully" });
  } catch (error) {
    console.error("Error deleting Promotion:", error);
    res.status(500).send("Something went wrong while deleting the promotion.");
  }
});

module.exports = router;
