const { ObjectId } = require("mongodb");
const { client } = require("../../config/db");
const express = require("express");
const router = express.Router();

// Collection for Trainers
const TrainersCollection = client.db("Seven-Gym").collection("Trainers");

// Get Trainers with filtering options
router.get("/", async (req, res) => {
  try {
    const {
      id, // 👈 Added for _id filtering
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
      specialization,
      languagesSpoken,
    } = req.query;

    const query = {};

    // 🔍 If only _id is given, return that specific trainer
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid trainer ID format." });
      }

      const trainer = await TrainersCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!trainer) {
        return res.status(404).json({ error: "Trainer not found." });
      }

      return res.json(trainer);
    }

    // 🧠 Apply other filters only if not fetching by ID
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

    const result = await TrainersCollection.find(query).toArray();

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

// Get Trainer Basic Info by _id
router.get("/BasicInfo", async (req, res) => {
  try {
    const { id } = req.query;

    // If _id is provided, return the specific trainer's basic information
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid trainer ID format." });
      }

      const trainer = await TrainersCollection.findOne(
        { _id: new ObjectId(id) },
        {
          projection: {
            _id: 1,
            name: 1,
            specialization: 1,
            imageUrl: 1,
            tier: 1,
            gender: 1,
            age: 1,
            experience: 1,
          },
        }
      );

      if (!trainer) {
        return res.status(404).json({ error: "Trainer not found." });
      }

      return res.json(trainer);
    } else {
      return res.status(400).json({ error: "Trainer ID is required." });
    }
  } catch (error) {
    console.error("Error fetching trainer basic info:", error.message);
    res.status(500).json({
      error: "Something went wrong while fetching trainer basic info.",
    });
  }
});

router.get("/TrainerIdByName", async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res
        .status(400)
        .json({ error: "Name query parameter is required" });
    }

    // Find trainer by name
    const trainer = await TrainersCollection.findOne({
      name: { $regex: new RegExp(name, "i") },
    });

    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found" });
    }

    // Return the trainer's ID
    res.json({ id: trainer._id });
  } catch (error) {
    console.error("Error fetching trainer by name:", error.message);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching trainer ID." });
  }
});

// Get all trainers' names and IDs only
router.get("/Name", async (req, res) => {
  try {
    const result = await TrainersCollection.find(
      {}, // no filter
      {
        projection: { _id: 1, name: 1 }, // only fetch _id and trainerName
      }
    ).toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching trainer names:", error);
    res.status(500).send("Something went wrong.");
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

router.get("/TestimonialsByEmail", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .json({ error: "Email query parameter is required." });
    }

    const trainers = await TrainersCollection.find({
      testimonials: { $elemMatch: { email } },
    }).toArray();

    const testimonialsByEmail = [];

    trainers.forEach((trainer) => {
      trainer.testimonials
        .filter((t) => t.email === email)
        .forEach((t) => {
          testimonialsByEmail.push({
            trainerName: trainer.name,
            trainerId: trainer._id,
            ...t,
          });
        });
    });

    res.send(testimonialsByEmail);
  } catch (error) {
    console.error("Error fetching testimonials by email:", error.message);
    res
      .status(500)
      .json({ error: "Something went wrong while fetching testimonials." });
  }
});

// Route to add a new trainer
router.post("/", async (req, res) => {
  try {
    const trainerData = req.body;

    // Basic validation: check for required fields
    if (!trainerData || !trainerData.name || !trainerData.email) {
      return res
        .status(400)
        .json({ error: "Trainer name and email are required." });
    }

    // Optional: Check if a trainer with the same email already exists
    const existingTrainer = await TrainersCollection.findOne({
      email: trainerData.email,
    });

    if (existingTrainer) {
      return res
        .status(409)
        .json({ error: "A trainer with this email already exists." });
    }

    // Insert trainer
    const result = await TrainersCollection.insertOne(trainerData);

    res.status(201).json({
      message: "Trainer added successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding trainer:", error.message);
    res
      .status(500)
      .json({ error: "Something went wrong while adding the trainer." });
  }
});

// POST : Inputs the Ban Element in to the Corresponding Trainer
router.post("/AddBanElement/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid trainer ID format." });
    }

    const banData = req.body;

    if (!banData || typeof banData !== "object") {
      return res.status(400).json({ error: "Ban data is missing or invalid." });
    }

    // Set the 'ban' field to the new banData (overwrite any existing ban)
    const updateResult = await TrainersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ban: banData } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res.json({ message: "Ban added successfully." });
  } catch (error) {
    console.error("Error setting ban:", error.message);
    res.status(500).json({ error: "Failed to set ban." });
  }
});

// PATCH : Remove the Ban Object from the Trainer
router.patch("/UnBan/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid trainer ID format." });
    }

    const updateResult = await TrainersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $unset: { ban: "" } } // Remove the 'ban' field
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res.json({ message: "Trainer unbanned successfully." });
  } catch (error) {
    console.error("Error unbanning trainer:", error.message);
    res.status(500).json({ error: "Failed to unban trainer." });
  }
});

// PATCH : Updater Tier of The Trainer According to the Trainer Id
router.patch("/UpdateTier", async (req, res) => {
  try {
    const { id, newTier } = req.body;

    if (!id || !newTier) {
      return res
        .status(400)
        .json({ error: "Trainer ID and new tier are required." });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid trainer ID format." });
    }

    const result = await TrainersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { tier: newTier } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Trainer not found or tier already set." });
    }

    res.json({ success: true, message: "Trainer tier updated successfully." });
  } catch (error) {
    console.error("Error updating tier:", error.message);
    res.status(500).json({ error: "Failed to update trainer tier." });
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

// Update Trainer Header Information : specialization, imageUrl
router.put("/UpdateTrainerHeaderInfo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { specialization, imageUrl } = req.body;

    // Ensure at least one field is provided for an update
    if (!specialization && !imageUrl) {
      return res
        .status(400)
        .json({ error: "At least one field is required for update." });
    }

    // Build update object dynamically
    const updateFields = {};
    if (specialization) updateFields.specialization = specialization;
    if (imageUrl) updateFields.imageUrl = imageUrl;

    // Update the trainer's profile in the main collection
    const result = await TrainersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res.json({
      message: "Trainer profile updated successfully.",
      updatedFields: updateFields,
    });
  } catch (error) {
    console.error("Error updating trainer profile:", error.message);
    res.status(500).json({
      error: "Something went wrong while updating the trainer profile.",
    });
  }
});

// Update Trainer About Information : bio, experience, age
router.put("/UpdateTrainerAboutInfo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { bio, experience, age } = req.body;

    // Ensure at least one field is provided for an update
    if (!bio && !experience && !age) {
      return res
        .status(400)
        .json({ error: "At least one field is required for update." });
    }

    // Build update object dynamically
    const updateFields = {};
    if (bio) updateFields.bio = bio;
    if (experience) updateFields.experience = parseInt(experience, 10);
    if (age) updateFields.age = parseInt(age, 10);

    // Update the trainer's profile in the collection
    const result = await TrainersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res.json({
      message: "Trainer profile updated successfully.",
      updatedFields: updateFields,
    });
  } catch (error) {
    console.error("Error updating trainer profile:", error.message);
    res.status(500).json({
      error: "Something went wrong while updating the trainer profile.",
    });
  }
});

// Update Trainer Contact Information
router.put("/UpdateTrainerContactInfo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { contact } = req.body;

    // Validate ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid trainer ID." });
    }

    // Ensure at least one field is provided for update
    if (!contact || Object.keys(contact).length === 0) {
      return res
        .status(400)
        .json({ error: "At least one contact field is required for update." });
    }

    // Dynamically update contact fields
    const updateFields = {};
    if (contact && typeof contact === "object") {
      updateFields.contact = { ...contact };
    }

    // Update the trainer's profile in the database
    const result = await TrainersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res.json({
      message: "Trainer contact information updated successfully.",
      updatedFields: updateFields,
    });
  } catch (error) {
    console.error("Error updating trainer profile:", error);
    res.status(500).json({
      error: "Something went wrong while updating the trainer profile.",
    });
  }
});

// Update Trainer Details Information
router.put("/UpdateTrainerDetailsInfo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      certifications,
      awards,
      preferences,
      languagesSpoken,
      additionalServices,
      equipmentUsed,
      partnerships,
    } = req.body;

    // Ensure at least one field is provided for an update
    if (
      !certifications &&
      !awards &&
      !preferences &&
      !languagesSpoken &&
      !additionalServices &&
      !equipmentUsed &&
      !partnerships
    ) {
      return res
        .status(400)
        .json({ error: "At least one field is required for update." });
    }

    // Build update object dynamically
    const updateFields = {};

    if (certifications) updateFields.certifications = certifications;
    if (awards) {
      updateFields.awards = awards.map((award) => ({
        title: award.title,
        year: award.year,
        organization: award.organization,
      }));
    }
    if (preferences) {
      updateFields.preferences = {
        focusAreas: preferences.focusAreas || [],
        classTypes: preferences.classTypes || [],
      };
    }
    if (languagesSpoken) updateFields.languagesSpoken = languagesSpoken;
    if (additionalServices)
      updateFields.additionalServices = additionalServices;
    if (equipmentUsed) updateFields.equipmentUsed = equipmentUsed;
    if (partnerships) {
      updateFields.partnerships = partnerships.map((partnership) => ({
        partnerName: partnership.partnerName,
        website: partnership.website,
      }));
    }

    // Update the trainer's profile in the collection
    const result = await TrainersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res.json({
      message: "Trainer profile updated successfully.",
      updatedFields: updateFields,
    });
  } catch (error) {
    console.error("Error updating trainer profile:", error.message);
    res.status(500).json({
      error: "Something went wrong while updating the trainer profile.",
    });
  }
});

// Add a testimonial to a Trainer by ID
router.patch("/AddTestimonials/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { clientAvatar, clientName, testimonial, email, rating } = req.body;

    // Validate the required fields
    if (!clientAvatar || !clientName || !testimonial || !email || !rating) {
      return res.status(400).json({
        error:
          "All fields (clientAvatar, clientName, testimonial, email, rating) are required.",
      });
    }

    // Check if the rating is a valid number (1-5)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    // Fetch the trainer by ID
    const trainer = await TrainersCollection.findOne({ _id: new ObjectId(id) });

    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found" });
    }

    // Construct the new testimonial object
    const newTestimonial = {
      clientAvatar,
      clientName,
      testimonial,
      email,
      rating,
    };

    // Update the trainer's testimonials array by adding the new testimonial
    const result = await TrainersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { testimonials: newTestimonial } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: "Failed to add the testimonial." });
    }

    // Send a success message
    res.status(200).json({ message: "Testimonial added successfully!" });
  } catch (error) {
    console.error("Error adding testimonial:", error.message);
    res
      .status(500)
      .json({ error: "Something went wrong while adding the testimonial." });
  }
});

// DELETE : testimonial by trainerId and user email
router.delete("/DeleteTestimonial", async (req, res) => {
  try {
    const { trainerId, userEmail } = req.query;

    if (!trainerId || !userEmail) {
      return res.status(400).json({ error: "Missing trainerId or userEmail." });
    }

    if (!ObjectId.isValid(trainerId)) {
      return res.status(400).json({ error: "Invalid trainer ID format." });
    }

    // Find the trainer to ensure they exist
    const trainer = await TrainersCollection.findOne({
      _id: new ObjectId(trainerId),
    });

    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    // Remove the testimonial with matching email
    const updateResult = await TrainersCollection.updateOne(
      { _id: new ObjectId(trainerId) },
      { $pull: { testimonials: { email: userEmail } } }
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Testimonial not found or already deleted." });
    }

    res.json({ message: "Testimonial deleted successfully." });
  } catch (error) {
    console.error("Error deleting testimonial:", error.message);
    res
      .status(500)
      .json({ error: "Something went wrong while deleting testimonial." });
  }
});

// DELETE : Trainer By Id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid trainer ID format." });
    }

    const result = await TrainersCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    res.json({ message: "Trainer deleted successfully." });
  } catch (error) {
    console.error("Error deleting trainer:", error.message);
    res
      .status(500)
      .json({ error: "Something went wrong while deleting trainer." });
  }
});

module.exports = router;
