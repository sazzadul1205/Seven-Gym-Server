const { client } = require("../../config/db");
const express = require("express");
const router = express.Router();

// Collection for Trainers
const TrainerClassInformationCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Class_Information");

router.get("/", async (req, res) => {
  try {
    const classes = await TrainerClassInformationCollection.find().toArray();
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error fetching trainer classes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newClass = req.body;

    // Basic validation
    if (
      !newClass.classType ||
      !newClass.description ||
      typeof newClass.participantLimit !== "number" ||
      !newClass.priceRange
    ) {
      return res.status(400).json({ error: "Missing or invalid class data" });
    }

    const result = await TrainerClassInformationCollection.insertOne(newClass);
    res
      .status(201)
      .json({ message: "Trainer class added", id: result.insertedId });
  } catch (error) {
    console.error("Error adding trainer class:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
