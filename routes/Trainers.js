const { client } = require("../config/db");
const express = require("express");
const router = express.Router();

// Collection for Trainers
const TrainersCollection = client.db("Seven-Gym").collection("Trainers");

// Get Trainers with filtering options
router.get("/", async (req, res) => {
  try {
    const {
      name,
      tier,
      email,
      gender,
      feeMin,
      feeMax,
      classType,
      focusArea,
      experienceMin,
      experienceMax,
      languagesSpoken,
      specialization,
    } = req.query;

    const query = {};

    // Apply filters only if they are provided
    if (name) {
      query.name = { $regex: new RegExp(name, "i") };
    }
    if (email) {
      query.email = { $regex: new RegExp(email, "i") };
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
        ...(experienceMin && { $gte: parseInt(experienceMin, 10) }),
        ...(experienceMax && { $lte: parseInt(experienceMax, 10) }),
      };
    }
    if (feeMin || feeMax) {
      query.fee = {
        ...(feeMin && { $gte: parseFloat(feeMin) }),
        ...(feeMax && { $lte: parseFloat(feeMax) }),
      };
    }
    if (languagesSpoken) {
      query.languagesSpoken = { $in: languagesSpoken.split(",") };
    }
    if (classType) {
      query["preferences.classTypes"] = { $in: classType.split(",") };
    }
    if (focusArea) {
      query["preferences.focusAreas"] = { $in: focusArea.split(",") };
    }

    // Fetch trainers based on filters
    const result = await TrainersCollection.find(query).toArray();

    // Return all trainers if no filters are applied
    if (!Object.keys(query).length) {
      return res.send(await TrainersCollection.find().toArray());
    }

    res.send(result);
  } catch (error) {
    console.error("Error fetching trainers:", error.message);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching trainers." });
  }
});

// Get Only Trainers Names and IDs
router.get("/names-and-ids", async (req, res) => {
  try {
    const result = await TrainersCollection.find(
      {},
      { projection: { name: 1, _id: 1 } }
    ).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer Names and IDs:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Specializations
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

// Get Tiers
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

// Get languages Spoken
router.get("/languagesSpoken", async (req, res) => {
  try {
    const result = await TrainersCollection.aggregate([
      {
        $unwind: "$languagesSpoken", // Flatten the array
      },
      {
        $group: {
          _id: "$languagesSpoken", // Group by each language
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
    console.error("Error fetching languagesSpoken:", error);
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

// Fetch Teachers by Name (One or More)
router.get("/SearchTrainersByNames", async (req, res) => {
  try {
    const { names } = req.query;

    // Check if names are provided
    if (!names) {
      return res.status(400).send({ error: "Names parameter is required." });
    }

    // Split the comma-separated names and clean up spaces
    const nameArray = names.split(",").map((name) => name.trim());

    // Query: Case-insensitive partial matching for names
    let query;
    if (nameArray.length === 1) {
      // If only one name is provided, perform an exact match
      query = { name: { $regex: new RegExp(nameArray[0], "i") } };
    } else {
      // If multiple names are provided, use $in for partial matching
      query = { name: { $in: nameArray.map((n) => new RegExp(n, "i")) } };
    }

    // Fetch data from MongoDB
    const result = await TrainersCollection.find(query).toArray();

    // Return response
    res.send(result);
  } catch (error) {
    console.error("Error fetching teachers by names:", error);
    res.status(500).send({ error: "Something went wrong." });
  }
});

// Temporary Route for Trainer Info
router.get("/TrainerInfo", async (req, res) => {
  try {
    const { name, specialization } = req.query;
    const query = {};

    // Add name filter if provided
    if (name) {
      query.name = { $regex: new RegExp(name, "i") }; // Case-insensitive partial match
    }

    // Add specialization filter if provided
    if (specialization) {
      query.specialization = { $regex: new RegExp(specialization, "i") }; // Case-insensitive search
    }

    // Fetch trainers based on the constructed query
    const trainers = await TrainersCollection.find(query).toArray();

    // Map trainers to only include the required fields
    const result = trainers.map((trainer) => ({
      name: trainer.name,
      specialization: trainer.specialization,
      availableDays: trainer.availableDays,
      classTypes: trainer.preferences ? trainer.preferences.classTypes : [],
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching trainer info:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Update Class Types for a Trainer
router.put("/UpdateTrainerClassTypes", async (req, res) => {
  try {
    const { email, id, classTypes } = req.body;

    if (!email && !id) {
      return res.status(400).json({ error: "Email or ID is required." });
    }
    if (!classTypes || !Array.isArray(classTypes)) {
      return res
        .status(400)
        .json({ error: "Valid classTypes array is required." });
    }

    const query = email ? { email } : { _id: new ObjectId(id) };

    const update = {
      $set: { "preferences.classTypes": classTypes },
    };

    const result = await TrainersCollection.updateOne(query, update);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res.json({ message: "Class types updated successfully." });
  } catch (error) {
    console.error("Error updating class types:", error.message);
    res
      .status(500)
      .json({ error: "Something went wrong while updating class types." });
  }
});

module.exports = router;
