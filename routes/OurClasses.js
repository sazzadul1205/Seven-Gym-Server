const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Our_Classes
const Our_ClassesCollection = client.db("Seven-Gym").collection("Our_Classes");

// Get Our_Classes
router.get("/", async (req, res) => {
  try {
    const result = await Our_ClassesCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Our_Classes:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Unique Modules
router.get("/modules", async (req, res) => {
  try {
    const result = await Our_ClassesCollection.aggregate([
      {
        $unwind: "$classes", // Deconstruct the 'classes' array
      },
      {
        $group: {
          _id: "$classes.module", // Group by module names
        },
      },
      {
        $sort: {
          _id: 1, // Sort module names alphabetically
        },
      },
    ]).toArray();

    const modules = result.map((item) => item._id); // Extract module names
    res.send(modules);
  } catch (error) {
    console.error("Error fetching unique modules:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get classes by module name
router.get("/searchByModule", async (req, res) => {
  const { moduleName } = req.query; // Get the module name from the query string

  if (!moduleName) {
    return res.status(400).send("Module name is required.");
  }

  try {
    // Aggregate query to find the module and get the corresponding days and times
    const result = await Our_ClassesCollection.aggregate([
      {
        $unwind: "$classes", // Deconstruct the 'classes' array
      },
      {
        $match: {
          "classes.module": moduleName, // Match the module name
        },
      },
      {
        $project: {
          day: 1, // Show the day of the class
          "classes.startTime": 1, // Show the start time
          "classes.endTime": 1, // Show the end time
        },
      },
      {
        $sort: { day: 1 }, // Optionally sort by day if needed
      },
    ]).toArray();

    if (result.length === 0) {
      return res.status(404).send("No classes found for the given module.");
    }

    // Format the response to list all days and times
    const formattedResult = result.map((item) => ({
      day: item.day,
      startTime: item.classes.startTime,
      endTime: item.classes.endTime,
    }));

    res.send(formattedResult);
  } catch (error) {
    console.error("Error fetching classes by module:", error);
    res.status(500).send("Something went wrong.");
  }
});

// searchByModule?moduleName=Yoga

module.exports = router;
