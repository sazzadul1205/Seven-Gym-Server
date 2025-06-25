const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Class_Details
const Class_DetailsCollection = client
  .db("Seven-Gym")
  .collection("Class_Details");

// Get Class_Details by Module
router.get("/", async (req, res) => {
  const moduleName = req.query.module;

  try {
    if (moduleName) {
      // If a module name is provided, fetch a single matching class
      const result = await Class_DetailsCollection.findOne({
        module: moduleName,
      });

      if (!result) {
        return res.status(404).send("No class found for the specified module.");
      }

      return res.send(result); // Send as an object
    }

    // If no module filter, return all as an array
    const result = await Class_DetailsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Class_Details:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Class_Details by Multiple Modules
router.get("/multi", async (req, res) => {
  const { modules } = req.query; // Get `modules` from query parameters (comma-separated values expected)

  try {
    if (!modules) {
      return res.status(400).send("Modules parameter is required.");
    }

    // Split `modules` into an array and construct query
    const moduleList = modules.split(",");
    const query = { module: { $in: moduleList } };

    // Fetch data based on the query
    const result = await Class_DetailsCollection.find(query).toArray();

    if (result.length === 0) {
      return res
        .status(404)
        .send("No classes found for the specified modules.");
    }

    res.send(result);
  } catch (error) {
    console.error("Error fetching Class_Details:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST Endpoint: Add a new Class Detail
router.post("/", async (req, res) => {
  try {
    const newClassDetail = req.body; // Get new class details from the request body

    // Insert the new class details into the collection
    const result = await Class_DetailsCollection.insertOne(newClassDetail);

    res.status(201).send({
      message: "Class detail added successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).send("Something went wrong.");
  }
});

// PUT: Add or Remove a Trainer to/from a Class by module name
router.put("/trainer", async (req, res) => {
  try {
    const { module, trainer, action } = req.body;

    console.log("Incoming payload:", req.body);

    // Validate required fields
    if (!module || !trainer || !trainer._id || !action) {
      return res
        .status(400)
        .send("Module, trainer (with _id), and action are required.");
    }

    // Validate trainer ID format
    if (!ObjectId.isValid(trainer._id)) {
      return res.status(400).send("Invalid trainer ID format.");
    }

    // Find the class by module
    const classData = await Class_DetailsCollection.findOne({ module });

    if (!classData) {
      return res.status(404).send("Class not found for the specified module.");
    }

    let updatedTrainers;

    if (action === "add") {
      const alreadyExists = classData.trainers?.some(
        (t) => t._id === trainer._id
      );

      if (alreadyExists) {
        return res.status(409).send("Trainer is already added to this class.");
      }

      updatedTrainers = [...(classData.trainers || []), trainer];
    } else if (action === "remove") {
      updatedTrainers = (classData.trainers || []).filter(
        (t) => t._id !== trainer._id
      );
    } else {
      return res.status(400).send("Invalid action. Use 'add' or 'remove'.");
    }

    const updateResult = await Class_DetailsCollection.updateOne(
      { module },
      { $set: { trainers: updatedTrainers } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).send("Failed to update trainers.");
    }

    res.send({
      message: `Trainer ${
        action === "add" ? "added to" : "removed from"
      } class.`,
    });
  } catch (error) {
    console.error("Trainer update error:", error);
    res.status(500).send("Something went wrong while updating the trainer.");
  }
});

// PUT Endpoint: Update Class Details by ID
router.put("/:id", async (req, res) => {
  const classId = req.params.id;
  const updatedData = req.body;

  try {
    // Validate ID format
    if (!ObjectId.isValid(classId)) {
      return res.status(400).send("Invalid class ID.");
    }

    // Build the update query
    const filter = { _id: new ObjectId(classId) };
    const updateDoc = {
      $set: {
        ...updatedData,
      },
    };

    // Execute update
    const result = await Class_DetailsCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).send("Class not found.");
    }

    res.send({ message: "Class updated successfully." });
  } catch (error) {
    console.error("Error updating Class_Detail:", error);
    res.status(500).send("Something went wrong while updating the class.");
  }
});

// DELETE Endpoint: Delete Class Details by Module Name
router.delete("/", async (req, res) => {
  const moduleName = req.query.module; // Get the module name from query parameters
  try {
    // Validate if module name is provided
    if (!moduleName) {
      return res.status(400).send("Module name is required.");
    }

    // Delete the class details by module name
    const result = await Class_DetailsCollection.deleteOne({
      module: moduleName,
    });

    if (result.deletedCount === 0) {
      return res.status(404).send("No class found with the specified module.");
    }

    res.send({ message: "Class deleted successfully." });
  } catch (error) {
    console.error("Error deleting Class_Detail:", error);
    res.status(500).send("Something went wrong while deleting the class.");
  }
});

module.exports = router;
