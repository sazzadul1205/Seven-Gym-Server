const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Trainers_Schedule
const Trainers_ScheduleCollection = client
  .db("Seven-Gym")
  .collection("Trainers_Schedule");

// Get Trainers_Schedule
router.get("/", async (req, res) => {
  try {
    const result = await Trainers_ScheduleCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainers_Schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get the next session after a specific time on a specific day
router.get("/SelectedSession", async (req, res, next) => {
  const { trainerId, trainerName, day, time } = req.query;

  if (!day || !time || (!trainerId && !trainerName)) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const trainer = await Trainers_ScheduleCollection.findOne(
      trainerId
        ? { _id: trainerId }
        : { trainerName: { $regex: new RegExp(`^${trainerName}$`, "i") } }
    );

    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found." });
    }

    const { trainerSchedule } = trainer;

    if (!trainerSchedule || !trainerSchedule[day]) {
      return res.status(404).json({ error: `No schedule found for ${day}.` });
    }

    const daySchedule = trainerSchedule[day];

    // Return the session only if it exactly matches the provided time.
    if (daySchedule[time]) {
      return res.json({
        trainerName: trainer.trainerName,
        day,
        time,
        session: daySchedule[time],
      });
    }

    // If no exact match is found, return a 404 error.
    return res
      .status(404)
      .json({ error: `No session found at ${time} on ${day}.` });
  } catch (error) {
    console.error("Error fetching session:", error);
    next(error);
  }
});

// Get all sessions for a trainer on a specific Time
router.get("/SameStartSession", async (req, res) => {
  const { trainerName, start } = req.query;

  if (!trainerName || !start) {
    return res
      .status(400)
      .json({ message: "Missing trainerName or start time in query." });
  }

  try {
    const trainer = await Trainers_ScheduleCollection.findOne({ trainerName });

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found." });
    }

    const schedule = trainer.trainerSchedule;
    const matchedSlots = [];

    // Go through each day
    for (const day in schedule) {
      const timeSlot = schedule[day][start];
      if (timeSlot) {
        matchedSlots.push({
          ...timeSlot,
          day,
        });
      }
    }

    res.json(matchedSlots);
  } catch (error) {
    console.error("Error fetching sessions at same start time:", error);
    res.status(500).send("Something went wrong.");
  }
});

router.get("/SameClassTypeSession", async (req, res) => {
  const { trainerName, classType } = req.query;

  try {
    // Fetch the trainer's schedule by name
    const trainer = await Trainers_ScheduleCollection.findOne({ trainerName });

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found." });
    }

    const schedule = trainer.trainerSchedule;
    const matchedSlots = [];

    // Loop through each day and time slot
    for (const day in schedule) {
      for (const time in schedule[day]) {
        const slot = schedule[day][time];
        if (slot.classType === classType) {
          matchedSlots.push({
            ...slot,
            day,
          });
        }
      }
    }

    res.json(matchedSlots);
  } catch (error) {
    console.error("Error filtering schedule:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get Trainer_Schedule by Trainer Name
router.get("/ByTrainerName", async (req, res) => {
  const { trainerName } = req.query; // Extract the Trainer Name from the query parameters

  if (!trainerName) {
    return res.status(400).send("Trainer Name query parameter is required.");
  }

  try {
    const result = await Trainers_ScheduleCollection.find({
      trainerName,
    }).toArray(); // Filter by Trainer Name
    if (result.length === 0) {
      return res.status(404).send("Trainer not found.");
    }
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Schedule by trainerName:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET route to fetch sessions by IDs via query
router.get("/ByID", async (req, res) => {
  let { ids } = req.query;

  // If no ids provided, return empty list
  if (!ids) {
    return res.json([]);
  }

  // Normalize to array
  if (!Array.isArray(ids)) {
    ids = [ids];
  }

  try {
    const result = [];

    // Group IDs by trainerName so we only fetch each trainer once
    const byTrainer = ids.reduce((acc, id) => {
      const [trainerName] = id.split("-");
      const key = trainerName;
      acc[key] = acc[key] || [];
      acc[key].push(id);
      return acc;
    }, {});

    // For each trainer, fetch just that schedule document
    for (const trainerKey of Object.keys(byTrainer)) {
      const trainerName = trainerKey.replace(/_/g, " ");
      const scheduleDoc = await Trainers_ScheduleCollection.findOne({
        trainerName,
      });

      if (!scheduleDoc || !scheduleDoc.trainerSchedule) continue;

      for (const id of byTrainer[trainerKey]) {
        const [, day, time] = id.split("-");
        const entry =
          scheduleDoc.trainerSchedule[day] &&
          scheduleDoc.trainerSchedule[day][time];

        if (entry && entry.id === id) {
          result.push({
            day,
            time,
            ...entry,
          });
        }
      }
    }

    return res.json(result);
  } catch (error) {
    console.error("Error fetching sessions by IDs:", error);
    return res.status(500).send("Something went wrong.");
  }
});


// Update Trainer's Schedule Endpoint
router.put("/Update", async (req, res) => {
  // Extract the trainer's name and updated schedule from the request body
  const { trainerName, trainerSchedule } = req.body;

  // Validate that both trainerName and trainerSchedule are provided
  if (!trainerName || !trainerSchedule) {
    return res.status(400).send("Trainer name and schedule are required.");
  }

  try {
    // Attempt to update the trainer's schedule in the database
    const result = await Trainers_ScheduleCollection.updateOne(
      { trainerName: trainerName }, // Find the trainer by their name
      { $set: { trainerSchedule: trainerSchedule } } // Update the trainer's schedule with the new data
    );

    // Check if the trainer was found and updated in the database
    if (result.matchedCount === 0) {
      return res.status(404).send("Trainer not found.");
    }

    // Send a success response if the update was successful
    res.send("Trainer schedule updated successfully.");
  } catch (error) {
    // Log the error for debugging and send a server error response
    console.error("Error updating Trainer's Schedule:", error);
    res.status(500).send("Something went wrong while updating the schedule.");
  }
});

// Check class Valid or Available
router.post("/SessionValidation", async (req, res) => {
  try {
    const booking = req.body;
    // Validate input: Check if booking object, trainer and sessions exist.
    if (
      !booking ||
      !booking.trainer ||
      !booking.sessions ||
      !Array.isArray(booking.sessions)
    ) {
      return res.status(400).send({ message: "Invalid booking data." });
    }

    // Find the trainer's schedule using the trainer's name.
    const trainerScheduleDoc = await Trainers_ScheduleCollection.findOne({
      trainerName: booking.trainer,
    });
    if (!trainerScheduleDoc) {
      return res.status(404).send({ message: "Trainer schedule not found." });
    }

    // Run our validation function against the schedule data.
    const validationResult = checkBookingValidity(
      booking,
      trainerScheduleDoc.trainerSchedule
    );
    res.send(validationResult);
  } catch (error) {
    console.error("Error validating booking:", error);
    res.status(500).send({ message: "Something went wrong." });
  }
});

module.exports = router;

function checkBookingValidity(booking, trainerSchedule) {
  // Loop through each session in the booking.
  for (let sessionId of booking.sessions) {
    let found = false;
    let sessionFull = false;
    // Iterate through each day in the trainer's schedule.
    for (let day in trainerSchedule) {
      for (let time in trainerSchedule[day]) {
        let session = trainerSchedule[day][time];
        if (session.id === sessionId) {
          found = true;
          // Count the number of participants (assumes 'participant' is an object with keys)
          const participantCount = session.participant
            ? Object.keys(session.participant).length
            : 0;
          if (participantCount >= session.participantLimit) {
            sessionFull = true;
          }
          break; // Stop iterating time slots once session is found.
        }
      }
      if (found) break; // Found session on this day; no need to check further days.
    }
    // If session wasn't found in schedule, return invalid with reason.
    if (!found) {
      return {
        valid: false,
        reason: `wrong class selected for session id: ${sessionId}`,
      };
    }
    // If the session was found but is full, return invalid.
    if (sessionFull) {
      return {
        valid: false,
        reason: `class full for session id: ${sessionId}`,
      };
    }
  }
  // All sessions passed validation.
  return { valid: true };
}
