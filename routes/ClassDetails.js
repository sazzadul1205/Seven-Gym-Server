const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Class_Details
const Class_DetailsCollection = client
  .db("Seven-Gym")
  .collection("Class_Details");

// Get Class_Details by Module
router.get("/", async (req, res) => {
  const moduleName = req.query.module; // Get the module name from query parameters
  try {
    // If `module` is provided, filter by it; otherwise, fetch all records
    const query = moduleName ? { module: moduleName } : {};
    const result = await Class_DetailsCollection.find(query).toArray();

    if (result.length === 0) {
      return res.status(404).send("No classes found for the specified module.");
    }

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
