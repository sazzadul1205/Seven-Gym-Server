const { client } = require("../config/db");
const express = require("express");
const router = express.Router();

// Collection for Trainers
const TrainersCollection = client.db("Seven-Gym").collection("Trainers");

// Get Trainers
// Assuming you're using MongoDB (or a similar DB that supports this syntax)
router.get("/", async (req, res) => {
  try {
    const {
      name,
      specialization,
      tier,
      gender,
      experienceMin,
      experienceMax,
      feeMin,
      feeMax,
      languages,
      classType,
      focusArea,
    } = req.query;

    const query = {};

    // Add filters to the query only if they are defined
    if (name) {
      query.name = { $regex: new RegExp(name, "i") }; // Partial match for name
    }
    if (specialization) {
      query.specialization = specialization;
    }
    if (tier) {
      query.tier = tier;
    }
    if (gender) {
      query.gender = gender;
    }
    if (experienceMin || experienceMax) {
      query.experience = {
        ...(experienceMin && { $gte: parseInt(experienceMin) }),
        ...(experienceMax && { $lte: parseInt(experienceMax) }),
      };
    }
    if (feeMin || feeMax) {
      query.fee = {
        ...(feeMin && { $gte: parseFloat(feeMin) }),
        ...(feeMax && { $lte: parseFloat(feeMax) }),
      };
    }
    if (languages) {
      query.languages = { $in: languages.split(",") };
    }
    if (classType) {
      query["preferences.classTypes"] = { $in: classType.split(",") };
    }
    if (focusArea) {
      query["preferences.focusAreas"] = { $in: focusArea.split(",") };
    }

    // If no filters are applied, return all trainers
    if (Object.keys(query).length === 0) {
      return res.send(await TrainersCollection.find().toArray());
    }

    const result = await TrainersCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainers:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.get("/specializations", async (req, res) => {
  try {
    const result = await TrainersCollection.aggregate([
      {
        $group: {
          _id: "$specialization",
        },
      },
      {
        $project: {
          _id: 0,
          specialization: "$_id",
        },
      },
    ]).toArray();
    res.send(result.map((item) => item.specialization));
  } catch (error) {
    console.error("Error fetching specializations:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.get("/tiers", async (req, res) => {
  try {
    const result = await TrainersCollection.aggregate([
      {
        $group: {
          _id: "$tier", // Group by the tier field
        },
      },
      {
        $project: {
          _id: 0, // Remove _id from the result
          tier: "$_id", // Rename _id to tier
        },
      },
    ]).toArray();

    // Send the distinct tiers as a response
    res.send(result.map((item) => item.tier));
  } catch (error) {
    console.error("Error fetching tiers:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Languages
router.get("/languages", async (req, res) => {
  try {
    const result = await TrainersCollection.aggregate([
      {
        $unwind: "$languages", // Flatten the array
      },
      {
        $group: {
          _id: "$languages", // Group by each language
        },
      },
      {
        $project: {
          _id: 0,
          language: "$_id", // Rename _id to language
        },
      },
    ]).toArray();
    res.send(result.map((item) => item.language));
  } catch (error) {
    console.error("Error fetching languages:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Class Types
router.get("/classTypes", async (req, res) => {
  try {
    const result = await TrainersCollection.aggregate([
      { $unwind: "$preferences.classTypes" }, // Unwind classTypes array
      { $group: { _id: "$preferences.classTypes" } }, // Group by class type
      { $project: { _id: 0, classType: "$_id" } }, // Project the result
    ]).toArray();
    res.send(result.map((item) => item.classType));
  } catch (error) {
    console.error("Error fetching class types:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Focus Areas
router.get("/focusAreas", async (req, res) => {
  try {
    const result = await TrainersCollection.aggregate([
      { $unwind: "$preferences.focusAreas" }, // Unwind focusAreas array
      { $group: { _id: "$preferences.focusAreas" } }, // Group by focus area
      { $project: { _id: 0, focusArea: "$_id" } }, // Project the result
    ]).toArray();
    res.send(result.map((item) => item.focusArea));
  } catch (error) {
    console.error("Error fetching focus areas:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get the max and min experience
router.get("/experienceMinMax", async (req, res) => {
  try {
    const result = await TrainersCollection.aggregate([
      {
        $group: {
          _id: null,
          maxExperience: { $max: "$experience" },
          minExperience: { $min: "$experience" },
        },
      },
    ]).toArray();

    const response = {
      maximum: result[0].maxExperience,
      minimum: result[0].minExperience,
    };

    res.send(response);
  } catch (error) {
    console.error("Error fetching experience min and max:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get the max and min fee per session
router.get("/feesMinMax", async (req, res) => {
  try {
    const result = await TrainersCollection.aggregate([
      {
        $group: {
          _id: null,
          maxFee: { $max: "$fees.perSession" },
          minFee: { $min: "$fees.perSession" },
        },
      },
    ]).toArray();

    const response = {
      maximum: result[0].maxFee,
      minimum: result[0].minFee,
    };

    res.send(response);
  } catch (error) {
    console.error("Error fetching fees min and max:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
