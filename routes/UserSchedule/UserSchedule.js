const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Import necessary modules and setup
const UserScheduleCollection = client
  .db("Seven-Gym")
  .collection("User_Schedule");

// Route to fetch user schedules (If Email is Provided Then Fetch)
router.get("/", async (req, res) => {
  try {
    const { email } = req.query; // Extract email from query parameters

    if (email) {
      // Fetch the schedule for the given email
      const result = await UserScheduleCollection.find({ email }).toArray();

      // If no schedule is found, return a 404 response
      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "No schedule found for the given email." });
      }

      return res.json(result); // Return the found schedule
    } else {
      // If no email is provided, fetch all schedules
      const result = await UserScheduleCollection.find().toArray();
      return res.json(result);
    }
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
});

// Get schedules by scheduleIDs for a specific user (identified by email)
router.get("/SchedulesById", async (req, res) => {
  try {
    let { scheduleIDs, email } = req.query; // Get scheduleIDs and email from query params

    // Validate input: Ensure both email and scheduleIDs are provided
    if (!scheduleIDs || !email) {
      return res
        .status(400)
        .json({ message: "Both email and scheduleIDs are required." });
    }

    // Convert scheduleIDs into an array if it's a single value
    scheduleIDs = Array.isArray(scheduleIDs) ? scheduleIDs : [scheduleIDs];

    // Fetch user's schedule from the database
    const userSchedule = await UserScheduleCollection.findOne({ email });

    // Check if user exists and has a schedule
    if (!userSchedule || !userSchedule.schedule) {
      return res.status(404).json({ message: "User schedule not found." });
    }

    // Create a Set for quick lookup of scheduleIDs
    const scheduleIDSet = new Set(scheduleIDs);

    // Extract and filter matching schedule items using flatMap for efficiency
    const matchingSchedules = Object.values(userSchedule.schedule)
      .flatMap((day) => Object.values(day.schedule))
      .filter((scheduleItem) => scheduleIDSet.has(scheduleItem.id));

    // Check if any matching schedules were found
    if (matchingSchedules.length === 0) {
      return res.status(404).json({
        message: "No matching schedules found for the provided scheduleIDs.",
      });
    }

    // Return the matching schedules
    res.json(matchingSchedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// Get schedule statuses (Full/Empty) by scheduleIDs for a specific user
router.get("/SchedulesEmptyCheck", async (req, res) => {
  try {
    let { scheduleIDs, email } = req.query; // Get scheduleIDs and email from query params

    // Validate input: Ensure both email and scheduleIDs are provided
    if (!scheduleIDs || !email) {
      return res
        .status(400)
        .json({ message: "Both email and scheduleIDs are required." });
    }

    // Convert scheduleIDs to an array if it's a single value
    scheduleIDs = Array.isArray(scheduleIDs) ? scheduleIDs : [scheduleIDs];

    // Fetch user's schedule from the database
    const userSchedule = await ScheduleCollection.findOne({ email });

    // Check if user exists and has a schedule
    if (!userSchedule || !userSchedule.schedule) {
      return res.status(404).json({ message: "User schedule not found." });
    }

    // Create a Set for quick lookup of scheduleIDs
    const scheduleIDSet = new Set(scheduleIDs);

    // Extract matching schedule statuses using flatMap
    const matchingSchedules = Object.values(userSchedule.schedule)
      .flatMap((day) => Object.values(day.schedule))
      .filter((scheduleItem) => scheduleIDSet.has(scheduleItem.id))
      .map((scheduleItem) => ({
        id: scheduleItem.id,
        status: scheduleItem.title ? "Full" : "Empty",
      }));

    // If no matching schedules were found
    if (matchingSchedules.length === 0) {
      return res.status(404).json({
        message: "No matching schedules found for the provided scheduleIDs.",
      });
    }

    // Return the matching schedule statuses
    res.json(matchingSchedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// Create a new schedule
router.post("/", async (req, res) => {
  try {
    const scheduleData = req.body; // Get incoming schedule data

    // Validate that scheduleData is not empty
    if (!scheduleData || Object.keys(scheduleData).length === 0) {
      return res.status(400).json({ message: "Schedule data is required." });
    }

    // Insert the new schedule into the database
    const result = await ScheduleCollection.insertOne(scheduleData);

    // If insertion fails
    if (!result.acknowledged) {
      return res.status(500).json({ message: "Failed to save the schedule." });
    }

    // Send a response with the inserted schedule ID
    res.status(201).json({
      message: "Schedule successfully created!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving schedule:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// PUT Request to Update Single or Multiple Schedule Entries
router.put("/AddSchedules", async (req, res) => {
  try {
    // Destructure request body
    const { email, scheduleIDs, title, notes, location, status } = req.body;

    // Validate input
    if (!email || !Array.isArray(scheduleIDs) || scheduleIDs.length === 0) {
      return res
        .status(400)
        .json({ message: "Email and scheduleIDs are required." });
    }

    // Find the user's schedule in the database
    const userSchedule = await ScheduleCollection.findOne({ email });

    // If the user is not found, return a 404 error
    if (!userSchedule) {
      return res.status(404).json({ message: "User not found." });
    }

    let updatedSchedules = [];

    // Iterate over the schedule for each day and time slot to update matching schedules
    Object.keys(userSchedule.schedule).forEach((day) => {
      Object.keys(userSchedule.schedule[day].schedule).forEach((time) => {
        const scheduleItem = userSchedule.schedule[day].schedule[time];

        // If the schedule ID matches any in the provided scheduleIDs, update the schedule entry
        if (scheduleIDs.includes(scheduleItem.id)) {
          // Only update properties if new values are provided
          scheduleItem.title = title ?? scheduleItem.title;
          scheduleItem.notes = notes ?? scheduleItem.notes;
          scheduleItem.location = location ?? scheduleItem.location;
          scheduleItem.status = status ?? scheduleItem.status;

          updatedSchedules.push(scheduleItem); // Add updated schedule item to the result array
        }
      });
    });

    // If no schedules were updated, return a 400 response
    if (updatedSchedules.length === 0) {
      return res
        .status(400)
        .json({ message: "No matching schedules to update." });
    }

    // Save the updated schedule back to the database
    await ScheduleCollection.updateOne(
      { email },
      { $set: { schedule: userSchedule.schedule } }
    );

    // Respond with a success message and updated schedules
    res.json({
      message: "Schedules updated successfully.",
      updatedSchedules,
    });
  } catch (error) {
    console.error("Error updating schedules:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Updated Route to Reset Schedule Entries
router.put("/DeleteSchedules", async (req, res) => {
  try {
    // Destructure the required fields from the request body
    const { email, scheduleIDs } = req.body;

    // Validate input to ensure email and scheduleIDs are provided
    if (!email || !Array.isArray(scheduleIDs) || scheduleIDs.length === 0) {
      return res
        .status(400)
        .json({ message: "Email and scheduleIDs are required." });
    }

    // Find the user's schedule from the database
    const userSchedule = await ScheduleCollection.findOne({ email });

    // If the user is not found, return a 404 error
    if (!userSchedule) {
      return res.status(404).json({ message: "User not found." });
    }

    let updatedSchedules = [];

    // Iterate over the schedule for each day and time slot to reset matching schedules
    Object.keys(userSchedule.schedule).forEach((day) => {
      Object.keys(userSchedule.schedule[day].schedule).forEach((time) => {
        const scheduleItem = userSchedule.schedule[day].schedule[time];

        // If the schedule ID matches any in the provided scheduleIDs, reset the schedule entry
        if (scheduleIDs.includes(scheduleItem.id)) {
          // Reset the schedule properties to empty values
          scheduleItem.title = "";
          scheduleItem.notes = "";
          scheduleItem.location = "";
          scheduleItem.status = "";

          // Track the updated schedule item
          updatedSchedules.push(scheduleItem);
        }
      });
    });

    // If no schedules were updated, return a 400 response
    if (updatedSchedules.length === 0) {
      return res
        .status(400)
        .json({ message: "No matching schedules to reset." });
    }

    // Save the updated schedule back to the database
    await ScheduleCollection.updateOne(
      { email },
      { $set: { schedule: userSchedule.schedule } }
    );

    // Respond with a success message and the updated schedules
    res.json({
      message: "Schedules reset successfully.",
      updatedSchedules,
    });
  } catch (error) {
    console.error("Error resetting schedules:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// PUT request to replace the user's schedule for a specific day.
router.put("/RegenerateNewDaySchedule", async (req, res) => {
  try {
    // Destructure request body
    const { email, dayName, scheduleData } = req.body;

    // Validate input: Ensure email, dayName, and scheduleData are provided
    if (!email || !dayName || !scheduleData) {
      return res
        .status(400)
        .json({ message: "Email, dayName, and scheduleData are required." });
    }

    // Find the user by email in the database
    const user = await ScheduleCollection.findOne({ email });

    // If user is not found, return a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the requested dayName exists in the user's schedule
    if (!user.schedule || !user.schedule[dayName]) {
      return res
        .status(404)
        .json({ message: `Schedule for ${dayName} not found.` });
    }

    // Update (replace) the schedule for the specified day
    await ScheduleCollection.updateOne(
      { email },
      { $set: { [`schedule.${dayName}`]: scheduleData } }
    );

    // Respond with success message
    res.json({ message: "Schedule updated successfully." });
  } catch (error) {
    console.error("Error updating Schedule:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// PUT Request to Add Notes for a specific user by email
router.put("/AddNotes", async (req, res) => {
  try {
    // Destructure email and newNote from the request body
    const { email, newNote } = req.body;

    // Input validation: Ensure email and newNote (object) are provided
    if (!email || !newNote || typeof newNote !== "object") {
      return res
        .status(400)
        .json({ message: "Email and newNote (object) are required." });
    }

    // Find the user's schedule in the database
    const userSchedule = await ScheduleCollection.findOne({ email });

    // If user is not found, return a 404 error
    if (!userSchedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found for the given email." });
    }

    // Initialize the notes array if not already present or not an array
    const currentNotes = Array.isArray(userSchedule.notes)
      ? userSchedule.notes
      : [];

    // Add the new note to the existing notes array
    currentNotes.push(newNote);

    // Update the user's schedule with the new notes array
    await ScheduleCollection.updateOne(
      { email },
      { $set: { notes: currentNotes } }
    );

    // Respond with success message
    res.json({ message: "Notes updated successfully." });
  } catch (error) {
    console.error("Error updating notes:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// PUT Request to Add Todo for a specific user by email
router.put("/AddToDo", async (req, res) => {
  try {
    const { email, newTodo } = req.body; // Expecting email and newTodo (object)

    // Input validation: Ensure email and newTodo are provided and newTodo is an object
    if (!email || !newTodo || typeof newTodo !== "object") {
      return res
        .status(400)
        .json({ message: "Email and newTodo (object) are required." });
    }

    // Find the user's schedule by email
    const userSchedule = await ScheduleCollection.findOne({ email });

    // If the user is not found, return a 404 error
    if (!userSchedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found for the given email." });
    }

    // Initialize todo array if not already an array
    const currentTodos = Array.isArray(userSchedule.todo)
      ? userSchedule.todo
      : [];

    // Add the new todo to the existing todo array
    currentTodos.push(newTodo);

    // Update the user's schedule with the new todo list
    await ScheduleCollection.updateOne(
      { email },
      { $set: { todo: currentTodos } }
    );

    // Respond with a success message
    res.json({ message: "To-do updated successfully." });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// PUT Request to Add Priority for a specific user by email
router.put("/AddPriority", async (req, res) => {
  try {
    const { email, newPriority } = req.body; // Expecting email and a single newPriority object

    // Input validation: Ensure email and newPriority are provided and newPriority is an object
    if (!email || !newPriority || typeof newPriority !== "object") {
      return res
        .status(400)
        .json({ message: "Email and newPriority (object) are required." });
    }

    // Find the user's schedule by email
    const userSchedule = await ScheduleCollection.findOne({ email });

    // If the user is not found, return a 404 error
    if (!userSchedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found for the given email." });
    }

    // Initialize priority array if not already an array
    const currentPriorities = Array.isArray(userSchedule.priority)
      ? userSchedule.priority
      : [];

    // Add the new priority object to the existing priority array
    currentPriorities.push(newPriority);

    // Update the user's schedule with the new priority list
    await ScheduleCollection.updateOne(
      { email },
      { $set: { priority: currentPriorities } }
    );

    // Respond with a success message
    res.json({ message: "Priority updated successfully." });
  } catch (error) {
    console.error("Error updating priority:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// PUT Request to reset the schedule for a specific user by email
router.put("/DeleteFullScheduleByEmail", async (req, res) => {
  try {
    const { email } = req.query; // Get email from query parameters
    const { schedule } = req.body; // Get the new schedule from request body

    // Validate input
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!schedule || typeof schedule !== "object") {
      return res
        .status(400)
        .json({ message: "Valid schedule data is required." });
    }

    // Find the user by email
    const scheduleDoc = await ScheduleCollection.findOne({ email });

    if (!scheduleDoc) {
      return res
        .status(404)
        .json({ message: "No schedule found for the given email." });
    }

    // Replace the existing schedule with the provided schedule
    const result = await ScheduleCollection.updateOne(
      { email },
      { $set: { schedule } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(500)
        .json({ message: "Failed to reset and update the schedule." });
    }

    return res.json({ message: "Schedule reset and updated successfully." });
  } catch (error) {
    console.error("Error resetting schedule:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// DELETE Request to remove a schedule by its ID
router.delete("/Schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid schedule ID format." });
    }

    // Delete the schedule by _id
    const result = await ScheduleCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    return res.json({ message: "Schedule deleted successfully." });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// DELETE Request to remove notes (single or multiple) by email and note ID(s)
router.delete("/DeleteNote", async (req, res) => {
  try {
    const { email, noteID, noteIDs } = req.body; // Expecting email and note ID(s)

    // Validate input
    if (!email || (!noteID && !noteIDs)) {
      return res
        .status(400)
        .json({ message: "Email and at least one note ID are required." });
    }

    // Find the user's schedule
    const result = await ScheduleCollection.findOne({ email });

    if (!result) {
      return res
        .status(404)
        .json({ message: "Schedule not found for the given email." });
    }

    // Handle deletion of notes (single or multiple)
    let updatedNotes;
    if (noteID) {
      updatedNotes = result.notes.filter((item) => item.id !== noteID);
    } else if (Array.isArray(noteIDs) && noteIDs.length > 0) {
      updatedNotes = result.notes.filter((item) => !noteIDs.includes(item.id));
    }

    // Update the document with the new notes array
    await ScheduleCollection.updateOne(
      { email },
      { $set: { notes: updatedNotes } }
    );

    return res.json({ message: "Note(s) deleted successfully." });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// DELETE Request to remove to-do items (single or multiple) by email and to-do ID(s)
router.delete("/DeleteToDo", async (req, res) => {
  try {
    const { email, todoID, todoIDs } = req.body; // Expecting email and to-do ID(s)

    // Validate input
    if (!email || (!todoID && !todoIDs)) {
      return res
        .status(400)
        .json({ message: "Email and at least one to-do ID are required." });
    }

    // Find the user's schedule
    const result = await ScheduleCollection.findOne({ email });

    if (!result) {
      return res
        .status(404)
        .json({ message: "Schedule not found for the given email." });
    }

    // Handle deletion of to-dos (single or multiple)
    let updatedToDos;
    if (todoID) {
      updatedToDos = result.todo.filter((item) => item.id !== todoID);
    } else if (Array.isArray(todoIDs) && todoIDs.length > 0) {
      updatedToDos = result.todo.filter((item) => !todoIDs.includes(item.id));
    }

    // Update the document with the new to-do list
    await ScheduleCollection.updateOne(
      { email },
      { $set: { todo: updatedToDos } }
    );

    return res.json({ message: "To-do item(s) deleted successfully." });
  } catch (error) {
    console.error("Error deleting to-do item:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// DELETE Request to remove priorities (single or multiple) by email and priority ID(s)
router.delete("/DeletePriority", async (req, res) => {
  try {
    const { email, priorityID, priorityIDs } = req.body; // Expecting email and priority ID(s)

    // Validate input
    if (!email || (!priorityID && !priorityIDs)) {
      return res
        .status(400)
        .json({ message: "Email and at least one priority ID are required." });
    }

    // Find the user's schedule
    const result = await ScheduleCollection.findOne({ email });

    if (!result) {
      return res
        .status(404)
        .json({ message: "Schedule not found for the given email." });
    }

    // Handle deletion of priorities (single or multiple)
    let updatedPriorities;
    if (priorityID) {
      updatedPriorities = result.priority.filter(
        (item) => item.id !== priorityID
      );
    } else if (Array.isArray(priorityIDs) && priorityIDs.length > 0) {
      updatedPriorities = result.priority.filter(
        (item) => !priorityIDs.includes(item.id)
      );
    }

    // Update the document with the new priority list
    await ScheduleCollection.updateOne(
      { email },
      { $set: { priority: updatedPriorities } }
    );

    return res.json({ message: "Priority(s) deleted successfully." });
  } catch (error) {
    console.error("Error deleting priority:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// DELETE Request to remove priorities (single or multiple) by email and priority ID(s)
router.delete("/DeletePriority", async (req, res) => {
  try {
    const { email, priorityID, priorityIDs } = req.body; // Expecting email and priority ID(s)

    // Validate input
    if (!email || (!priorityID && !priorityIDs)) {
      return res
        .status(400)
        .json({ message: "Email and at least one priority ID are required." });
    }

    // Find the user's schedule
    const result = await ScheduleCollection.findOne({ email });

    if (!result) {
      return res
        .status(404)
        .json({ message: "Schedule not found for the given email." });
    }

    // Handle deletion of priorities (single or multiple)
    let updatedPriorities;
    if (priorityID) {
      updatedPriorities = result.priority.filter(
        (item) => item.id !== priorityID
      );
    } else if (Array.isArray(priorityIDs) && priorityIDs.length > 0) {
      updatedPriorities = result.priority.filter(
        (item) => !priorityIDs.includes(item.id)
      );
    }

    // Update the document with the new priority list
    await ScheduleCollection.updateOne(
      { email },
      { $set: { priority: updatedPriorities } }
    );

    return res.json({ message: "Priority(s) deleted successfully." });
  } catch (error) {
    console.error("Error deleting priority:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

module.exports = router;