const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Schedule
const ScheduleCollection = client.db("Seven-Gym").collection("Schedule");

router.get("/", async (req, res) => {
  try {
    const { email } = req.query; // Get email from query parameters

    if (email) {
      // Find the schedule for the given email
      const result = await ScheduleCollection.find({ email: email }).toArray();

      if (result.length === 0) {
        return res.status(404).send("No schedule found for the given email.");
      }

      return res.send(result);
    } else {
      // If no email is provided, fetch all schedules
      const result = await ScheduleCollection.find().toArray();
      return res.send(result);
    }
  } catch (error) {
    console.error("Error fetching Schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get schedules by scheduleIDs for a specific user (identified by email)
router.get("/SchedulesById", async (req, res) => {
  try {
    let { scheduleIDs, email } = req.query; // Get scheduleIDs and email from query params

    if (!scheduleIDs || !email) {
      return res
        .status(400)
        .json({ message: "Both email and scheduleIDs are required." });
    }

    // If only one ID is given, convert it into an array
    if (!Array.isArray(scheduleIDs)) {
      scheduleIDs = [scheduleIDs];
    }

    // Fetch user schedule based on email
    const userSchedule = await ScheduleCollection.findOne({ email });

    if (!userSchedule) {
      return res.status(404).json({ message: "User not found." });
    }

    // Extract matching schedules
    const matchingSchedules = [];

    // Loop through the days in the user's schedule
    for (const day in userSchedule.schedule) {
      // Check the day's schedule for matching schedule IDs
      for (const time in userSchedule.schedule[day].schedule) {
        const scheduleItem = userSchedule.schedule[day].schedule[time];

        // If the schedule item's ID matches one of the provided scheduleIDs, add it to matchingSchedules
        if (scheduleIDs.includes(scheduleItem.id)) {
          matchingSchedules.push(scheduleItem);
        }
      }
    }

    // If no matching schedules are found
    if (matchingSchedules.length === 0) {
      return res.status(404).json({
        message: "No matching schedules found for the provided scheduleIDs.",
      });
    }

    // Return the matching schedules
    res.json(matchingSchedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Get schedules by scheduleIDs for a specific user (identified by email)
router.get("/SchedulesEmptyCheck", async (req, res) => {
  try {
    let { scheduleIDs, email } = req.query; // Get scheduleIDs and email from query params

    if (!scheduleIDs || !email) {
      return res
        .status(400)
        .json({ message: "Both email and scheduleIDs are required." });
    }

    // If only one ID is given, convert it into an array
    if (!Array.isArray(scheduleIDs)) {
      scheduleIDs = [scheduleIDs];
    }

    // Fetch user schedule based on email
    const userSchedule = await ScheduleCollection.findOne({ email });

    if (!userSchedule) {
      return res.status(404).json({ message: "User not found." });
    }

    // Extract matching schedules
    const matchingSchedules = [];

    // Loop through the days in the user's schedule
    for (const day in userSchedule.schedule) {
      // Check the day's schedule for matching schedule IDs
      for (const time in userSchedule.schedule[day].schedule) {
        const scheduleItem = userSchedule.schedule[day].schedule[time];

        // If the schedule item's ID matches one of the provided scheduleIDs, add it to matchingSchedules
        if (scheduleIDs.includes(scheduleItem.id)) {
          // Check if the title is empty
          const status = scheduleItem.title
            ? `${scheduleItem.id}: Full`
            : `${scheduleItem.id}: Empty`;
          matchingSchedules.push(status);
        }
      }
    }

    // If no matching schedules are found
    if (matchingSchedules.length === 0) {
      return res.status(404).json({
        message: "No matching schedules found for the provided scheduleIDs.",
      });
    }

    // Return the matching schedules with their statuses
    res.json(matchingSchedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Post Schedule
router.post("/", async (req, res) => {
  const scheduleData = req.body; // Incoming schedule data from the client

  try {
    // Insert the new schedule into the collection
    const result = await ScheduleCollection.insertOne(scheduleData);

    // Send a response with the inserted data or ID
    res.status(201).send({
      message: "Schedule successfully created!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving Schedule:", error);
    res.status(500).send("Failed to save the schedule.");
  }
});

// PUT Request to Update Single or Multiple Schedule Entries
router.put("/AddSchedules", async (req, res) => {
  try {
    const { email, scheduleIDs, title, notes, location, status } = req.body;

    if (!email || !Array.isArray(scheduleIDs) || scheduleIDs.length === 0) {
      return res
        .status(400)
        .json({ message: "Email and scheduleIDs are required." });
    }

    // Find the user's schedule
    const userSchedule = await ScheduleCollection.findOne({ email });

    if (!userSchedule) {
      return res.status(404).json({ message: "User not found." });
    }

    let updatedSchedules = [];

    // Iterate through all days in the user's schedule
    for (const day in userSchedule.schedule) {
      for (const time in userSchedule.schedule[day].schedule) {
        const scheduleItem = userSchedule.schedule[day].schedule[time];

        // If the schedule ID matches, update the entry
        if (scheduleIDs.includes(scheduleItem.id)) {
          scheduleItem.title = title || scheduleItem.title;
          scheduleItem.notes = notes || scheduleItem.notes;
          scheduleItem.location = location || scheduleItem.location;
          scheduleItem.status = status || scheduleItem.status;

          updatedSchedules.push(scheduleItem);
        }
      }
    }

    // Save the updated schedule back to the database
    await ScheduleCollection.updateOne(
      { email },
      { $set: { schedule: userSchedule.schedule } }
    );

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
    const { email, scheduleIDs } = req.body;

    if (!email || !Array.isArray(scheduleIDs) || scheduleIDs.length === 0) {
      return res
        .status(400)
        .json({ message: "Email and scheduleIDs are required." });
    }

    // Find the user's schedule
    const userSchedule = await ScheduleCollection.findOne({ email });

    if (!userSchedule) {
      return res.status(404).json({ message: "User not found." });
    }

    let updatedSchedules = [];

    // Iterate through all days in the user's schedule
    for (const day in userSchedule.schedule) {
      for (const time in userSchedule.schedule[day].schedule) {
        const scheduleItem = userSchedule.schedule[day].schedule[time];

        // If the schedule ID matches, reset the entry
        if (scheduleIDs.includes(scheduleItem.id)) {
          scheduleItem.title = "";
          scheduleItem.notes = "";
          scheduleItem.location = "";
          scheduleItem.status = "";

          updatedSchedules.push(scheduleItem);
        }
      }
    }

    // Save the updated schedule back to the database
    await ScheduleCollection.updateOne(
      { email },
      { $set: { schedule: userSchedule.schedule } }
    );

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
    const { email, dayName, scheduleData } = req.body; // Get email, dayName, and scheduleData from the request body

    // Input validation
    if (!email || !dayName || !scheduleData) {
      return res
        .status(400)
        .send("Email, dayName, and scheduleData are required.");
    }

    // Find the user by email
    const user = await ScheduleCollection.findOne({ email: email });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Check if the requested dayName exists in the user's schedule
    if (!user.schedule || !user.schedule[dayName]) {
      return res.status(404).send(`Schedule for ${dayName} not found.`);
    }

    // Fully update (replace) the schedule for the specified day
    await ScheduleCollection.updateOne(
      { email: email },
      { $set: { [`schedule.${dayName}`]: scheduleData } }
    );

    // Respond with success
    res.send("Schedule updated successfully.");
  } catch (error) {
    console.error("Error updating Schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT Request to Add Notes for a specific user by email
router.put("/AddNotes", async (req, res) => {
  try {
    const { email, newNote } = req.body; // Expecting email and newNote (object)

    if (!email || !newNote || typeof newNote !== "object") {
      return res.status(400).send("Email and newNote (object) are required.");
    }

    // Find the user's schedule
    const result = await ScheduleCollection.findOne({ email: email });

    if (!result) {
      return res.status(404).send("Schedule not found for the given email.");
    }

    // Ensure that notes is initialized as an array if it is not already
    const currentNotes = Array.isArray(result.notes) ? result.notes : [];

    // Add new note to the existing notes array
    currentNotes.push(newNote);

    await ScheduleCollection.updateOne(
      { email: email },
      { $set: { notes: currentNotes } }
    );

    return res.send("Notes updated successfully.");
  } catch (error) {
    console.error("Error updating notes:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT Request to Add Todo for a specific user by email
router.put("/AddToDo", async (req, res) => {
  try {
    const { email, newTodo } = req.body; // Expecting email and newTodo (object)

    if (!email || !newTodo || typeof newTodo !== "object") {
      return res.status(400).send("Email and newTodo (object) are required.");
    }

    // Find the user's schedule
    const result = await ScheduleCollection.findOne({ email: email });

    if (!result) {
      return res.status(404).send("Schedule not found for the given email.");
    }

    // Ensure that todo is initialized as an array if it is not already
    const currentTodos = Array.isArray(result.todo) ? result.todo : [];

    // Add new todo to the existing todo array
    currentTodos.push(newTodo);

    await ScheduleCollection.updateOne(
      { email: email },
      { $set: { todo: currentTodos } }
    );

    return res.send("To-do updated successfully.");
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT Request to Add Priority for a specific user by email
router.put("/AddPriority", async (req, res) => {
  try {
    const { email, newPriority } = req.body; // Expecting email and a single newPriority object

    if (!email || !newPriority || typeof newPriority !== "object") {
      return res
        .status(400)
        .send("Email and newPriority (object) are required.");
    }

    // Find the user's schedule
    const result = await ScheduleCollection.findOne({ email: email });

    if (!result) {
      return res.status(404).send("Schedule not found for the given email.");
    }

    // Ensure that priority is initialized as an array if it is not already
    const currentPriorities = Array.isArray(result.priority)
      ? result.priority
      : [];

    // Add the new priority object to the existing priority array
    currentPriorities.push(newPriority);

    await ScheduleCollection.updateOne(
      { email: email },
      { $set: { priority: currentPriorities } }
    );

    return res.send("Priority updated successfully.");
  } catch (error) {
    console.error("Error updating priority:", error);
    res.status(500).send("Something went wrong.");
  }
});

// This endpoint resets the "schedule" field for a given email and replaces it with a provided schedule.
router.put("/DeleteFullScheduleByEmail", async (req, res) => {
  try {
    const { email } = req.query; // Get email from query parameters
    const { schedule } = req.body; // Get the new schedule from request body

    if (!email) {
      return res.status(400).send("Email is required.");
    }

    if (!schedule || typeof schedule !== "object") {
      return res.status(400).send("Valid schedule data is required.");
    }

    // Check if the schedule exists
    const scheduleDoc = await ScheduleCollection.findOne({ email });

    if (!scheduleDoc) {
      return res.status(404).send("No schedule found for the given email.");
    }

    // Replace the existing schedule with the provided schedule
    const result = await ScheduleCollection.updateOne(
      { email },
      { $set: { schedule } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).send("Failed to reset and update the schedule.");
    }

    return res.send("Schedule reset and updated successfully.");
  } catch (error) {
    console.error("Error resetting schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Delete a schedule by _id
router.delete("/Schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;

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

    res.json({ message: "Schedule deleted successfully." });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// DELETE Request to Remove Notes (either single or multiple) by email and note ID(s)
router.delete("/DeleteNote", async (req, res) => {
  try {
    const { email, noteID, noteIDs } = req.body; // Expecting email, noteID (single), or noteIDs (array)

    if (!email || (!noteID && !noteIDs)) {
      return res
        .status(400)
        .send("Email and at least one note ID are required.");
    }

    // Find the user's schedule
    const result = await ScheduleCollection.findOne({ email: email });

    if (!result) {
      return res.status(404).send("Schedule not found for the given email.");
    }

    let updatedNotes;

    // Handle case for a single noteID
    if (noteID) {
      updatedNotes = result.notes.filter((item) => item.id !== noteID);
    }
    // Handle case for an array of noteIDs
    else if (Array.isArray(noteIDs) && noteIDs.length > 0) {
      updatedNotes = result.notes.filter((item) => !noteIDs.includes(item.id));
    }

    // If neither a single ID nor an array is provided, return an error
    if (!updatedNotes) {
      return res.status(400).send("Invalid note ID(s).");
    }

    // Update the document with the new notes array
    await ScheduleCollection.updateOne(
      { email: email },
      { $set: { notes: updatedNotes } }
    );

    return res.send("Note(s) deleted successfully.");
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE Request to Remove To-Do Items (either single or multiple) by email and to-do ID(s)
router.delete("/DeleteToDo", async (req, res) => {
  try {
    const { email, todoID, todoIDs } = req.body; // Expecting email, todoID (single), or todoIDs (array)

    if (!email || (!todoID && !todoIDs)) {
      return res
        .status(400)
        .send("Email and at least one to-do ID are required.");
    }

    // Find the user's schedule
    const result = await ScheduleCollection.findOne({ email: email });

    if (!result) {
      return res.status(404).send("Schedule not found for the given email.");
    }

    let updatedToDos;

    // Handle case for a single todoID
    if (todoID) {
      updatedToDos = result.todo.filter((item) => item.id !== todoID);
    }
    // Handle case for an array of todoIDs
    else if (Array.isArray(todoIDs) && todoIDs.length > 0) {
      updatedToDos = result.todo.filter((item) => !todoIDs.includes(item.id));
    }

    // If neither a single ID nor an array is provided, return an error
    if (!updatedToDos) {
      return res.status(400).send("Invalid to-do ID(s).");
    }

    // Update the document with the new to-do array
    await ScheduleCollection.updateOne(
      { email: email },
      { $set: { todo: updatedToDos } }
    );

    return res.send("To-do item(s) deleted successfully.");
  } catch (error) {
    console.error("Error deleting to-do item:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE Request to Remove Priorities (either single or multiple) by email and priority ID(s)
router.delete("/DeletePriority", async (req, res) => {
  try {
    const { email, priorityID, priorityIDs } = req.body; // Expecting email, priorityID (single), or priorityIDs (array)

    if (!email || (!priorityID && !priorityIDs)) {
      return res
        .status(400)
        .send("Email and at least one priority ID are required.");
    }

    // Find the user's schedule
    const result = await ScheduleCollection.findOne({ email: email });

    if (!result) {
      return res.status(404).send("Schedule not found for the given email.");
    }

    let updatedPriorities;

    // Handle case for a single priorityID
    if (priorityID) {
      updatedPriorities = result.priority.filter(
        (item) => item.id !== priorityID
      );
    }
    // Handle case for an array of priorityIDs
    else if (Array.isArray(priorityIDs) && priorityIDs.length > 0) {
      updatedPriorities = result.priority.filter(
        (item) => !priorityIDs.includes(item.id)
      );
    }

    // If neither a single ID nor an array is provided, return an error
    if (!updatedPriorities) {
      return res.status(400).send("Invalid priority ID(s).");
    }

    // Update the document with the new priorities array
    await ScheduleCollection.updateOne(
      { email: email },
      { $set: { priority: updatedPriorities } }
    );

    return res.send("Priority(s) deleted successfully.");
  } catch (error) {
    console.error("Error deleting priority:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
