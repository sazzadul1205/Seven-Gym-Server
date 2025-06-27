const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Users
const User_FormCollection = client.db("Seven-Gym").collection("User_Form");

// GET : Fetch all the Data
router.get("/", async (req, res) => {
  try {
    const forms = await User_FormCollection.find().toArray();
    res.status(200).json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST new Form
router.post("/", async (req, res) => {
  try {
    const formData = req.body;

    if (
      !formData ||
      !formData.fullName ||
      !formData.email ||
      !formData.position
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await User_FormCollection.insertOne(formData);
    res.status(201).json({
      message: "Form submitted successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error inserting form:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE : Remove a form by ID
router.delete("/:id", async (req, res) => {
  try {
    const formId = req.params.id;

    if (!ObjectId.isValid(formId)) {
      return res.status(400).json({ message: "Invalid form ID" });
    }

    const result = await User_FormCollection.deleteOne({
      _id: new ObjectId(formId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.status(200).json({ message: "Form deleted successfully" });
  } catch (error) {
    console.error("Error deleting form:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
