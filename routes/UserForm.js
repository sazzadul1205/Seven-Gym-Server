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

module.exports = router;
