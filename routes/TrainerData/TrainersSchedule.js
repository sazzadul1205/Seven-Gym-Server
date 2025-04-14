const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Trainers_Schedule
const Trainers_ScheduleCollection = client
  .db("Seven-Gym")
  .collection("Trainers_Schedule");

// Get Trainers_Schedule - filter by trainerName if provided
router.get("/", async (req, res) => {
  try {
    const { trainerName } = req.query;

    const filter = trainerName ? { trainerName } : {}; // empty = fetch all

    const result = await Trainers_ScheduleCollection.find(filter).toArray();
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

router.post("/UpdateParticipant", async (req, res) => {
  try {
    const { stripePaymentID, startAt } = req.body;

    if (!stripePaymentID || !startAt) {
      return res.status(400).send("stripePaymentID and startAt are required.");
    }

    const schedules = await Trainers_ScheduleCollection.find().toArray();
    let totalUpdated = 0;

    for (const schedule of schedules) {
      const { trainerSchedule } = schedule;
      let modified = false;

      for (const day in trainerSchedule) {
        for (const time in trainerSchedule[day]) {
          const session = trainerSchedule[day][time];

          if (Array.isArray(session.participant)) {
            let updatedInSession = false;

            session.participant.forEach((participant) => {
              if (participant.stripePaymentID === stripePaymentID) {
                participant.startAt = startAt;
                updatedInSession = true;
              }
            });

            if (updatedInSession) {
              modified = true;
              await Trainers_ScheduleCollection.updateOne(
                { _id: schedule._id },
                {
                  $set: {
                    [`trainerSchedule.${day}.${time}.participant`]:
                      session.participant,
                  },
                }
              );
              totalUpdated++;
            }
          }
        }
      }
    }

    if (totalUpdated > 0) {
      return res.send({
        success: true,
        message: `Updated ${totalUpdated} session(s) with startAt.`,
      });
    } else {
      return res
        .status(404)
        .send("No participant found with that stripePaymentID.");
    }
  } catch (error) {
    console.error("Error updating startAt:", error);
    res.status(500).send("Internal Server Error.");
  }
});

// Update participant list by trainerName and class IDs
router.put("/AddParticipant", async (req, res) => {
  const { trainerName, ids, payload } = req.body;

  if (!trainerName || !Array.isArray(ids) || !payload) {
    return res.status(400).send("trainerName, ids, and payload are required.");
  }

  try {
    const trainer = await Trainers_ScheduleCollection.findOne({ trainerName });

    if (!trainer) {
      return res.status(404).send("Trainer not found.");
    }

    const updatedSchedule = { ...trainer.trainerSchedule };

    for (const day in updatedSchedule) {
      for (const time in updatedSchedule[day]) {
        const session = updatedSchedule[day][time];
        if (ids.includes(session.id)) {
          // Ensure participant is an array
          if (!Array.isArray(session.participant)) {
            session.participant = [];
          }
          session.participant.push(payload);
        }
      }
    }

    // Save updated schedule
    await Trainers_ScheduleCollection.updateOne(
      { trainerName },
      { $set: { trainerSchedule: updatedSchedule } }
    );

    res.send("Participants added successfully.");
  } catch (error) {
    console.error("Error updating participants:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Remove participant by trainerName, class IDs, and bookerEmail
router.put("/RemoveParticipant", async (req, res) => {
  const { trainerName, ids, bookerEmail } = req.body;

  // Validate inputs
  if (!trainerName || !Array.isArray(ids) || !bookerEmail) {
    return res
      .status(400)
      .send("trainerName, ids, and bookerEmail are required.");
  }

  try {
    // Find the trainer schedule by trainerName
    const trainer = await Trainers_ScheduleCollection.findOne({ trainerName });

    if (!trainer) {
      return res.status(404).send("Trainer not found.");
    }

    const updatedSchedule = { ...trainer.trainerSchedule };

    let participantRemoved = false;

    // Iterate through each day in the trainer's schedule
    for (const day in updatedSchedule) {
      for (const time in updatedSchedule[day]) {
        const session = updatedSchedule[day][time];

        // Check if the session's ID matches any of the provided IDs
        if (ids.includes(session.id)) {
          // Check if the session has participants (assume they are stored as an array)
          if (Array.isArray(session.participant)) {
            // Find the participant to remove based on bookerEmail
            const participantIndex = session.participant.findIndex(
              (participant) => participant.bookerEmail === bookerEmail
            );

            if (participantIndex !== -1) {
              // Remove the participant from the session
              session.participant.splice(participantIndex, 1); // Remove the participant
              participantRemoved = true;
            }
          }
        }
      }
    }

    if (!participantRemoved) {
      return res.status(404).send("Participant not found.");
    }

    // Save the updated schedule after removing the participant
    await Trainers_ScheduleCollection.updateOne(
      { trainerName },
      { $set: { trainerSchedule: updatedSchedule } }
    );

    res.send("Participant removed successfully.");
  } catch (error) {
    console.error("Error removing participant:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Reset all participants in Trainers_Schedule
router.put("/ResetParticipants", async (req, res) => {
  try {
    const trainers = await Trainers_ScheduleCollection.find().toArray();

    const updatedTrainers = trainers.map((trainer) => {
      const schedule = trainer.trainerSchedule;

      for (const day in schedule) {
        for (const time in schedule[day]) {
          if (schedule[day][time]?.participant) {
            schedule[day][time].participant = {}; // or [] if that's your format
          }
        }
      }

      return {
        ...trainer,
        trainerSchedule: schedule,
      };
    });

    // Update each document
    const updatePromises = updatedTrainers.map((trainer) =>
      Trainers_ScheduleCollection.updateOne(
        { _id: trainer._id },
        { $set: { trainerSchedule: trainer.trainerSchedule } }
      )
    );

    await Promise.all(updatePromises);

    res.send({ message: "All participants reset successfully." });
  } catch (error) {
    console.error("Error resetting participants:", error);
    res.status(500).send("Failed to reset participants.");
  }
});

// PATCH route to accept bookings for specific sessions
router.patch("/AcceptBooking", async (req, res) => {
  // Destructure required properties from the request body.
  const {
    sessionIds = [],
    acceptedAt,
    stripePaymentID,
    bookerEmail,
  } = req.body;

  // Validate input: ensure none of the required values are missing.
  if (!sessionIds.length || !acceptedAt || !stripePaymentID || !bookerEmail) {
    return res.status(400).send("Missing required data.");
  }

  try {
    // Retrieve all trainer schedules from the database.
    const trainers = await Trainers_ScheduleCollection.find().toArray();

    // bulkOps will store all update operations for bulk writing.
    const bulkOps = [];
    // skippedSessions will keep track of session IDs that were skipped, along with a message.
    const skippedSessions = [];

    // Loop over each trainer document.
    for (const trainer of trainers) {
      const { _id, trainerSchedule } = trainer;

      // Flag to check if any update occurred on this trainer's schedule.
      let modified = false;

      // Loop over each day in the trainer's schedule.
      for (const day in trainerSchedule) {
        // Loop over each time slot within the day.
        for (const time in trainerSchedule[day]) {
          const session = trainerSchedule[day][time];

          // If the session's ID is not in the array of sessionIds to update, skip it.
          if (!sessionIds.includes(session.id)) continue;

          // Normalize the participant data into an array.
          let participants = [];
          if (Array.isArray(session.participant)) {
            participants = session.participant;
          } else if (
            typeof session.participant === "object" &&
            Object.keys(session.participant).length
          ) {
            participants = [session.participant];
          }

          // If there are no participants in this session, record the skip and continue.
          if (!participants.length) {
            skippedSessions.push(`${session.id} (no participants)`);
            continue;
          }

          // Map through the participants and update the matching participant (by bookerEmail).
          const updatedParticipants = participants.map((p) => {
            if (p.bookerEmail === bookerEmail) {
              return {
                ...p,
                stripePaymentID, // acceptedReqId, Add To link
                acceptedAt, // Set new accepted time.
                paid: true, // Mark as paid.
              };
            }
            return p; // Leave other participants unchanged.
          });

          // Check if any participant was updated (i.e., matching email found and updated).
          const wasUpdated = updatedParticipants.some(
            (p) => p.bookerEmail === bookerEmail && p.paid === true
          );

          if (!wasUpdated) {
            // Record if no matching email was found.
            skippedSessions.push(`${session.id} (no matching email)`);
            continue;
          }

          // Set the updated participants in the session.
          trainerSchedule[day][time].participant = updatedParticipants;
          modified = true;
        }
      }

      // If this trainer document was modified, add an update operation to bulkOps.
      if (modified) {
        bulkOps.push({
          updateOne: {
            filter: { _id },
            update: { $set: { trainerSchedule } },
          },
        });
      }
    }

    // If no update operations were added, nothing was updated.
    if (!bulkOps.length) {
      return res.status(404).send({
        success: false,
        message: "No sessions were updated.",
        skipped: skippedSessions,
      });
    }

    // Execute bulk update operations on the Trainers_Schedule collection.
    const result = await Trainers_ScheduleCollection.bulkWrite(bulkOps);

    // Return the result along with any sessions that were skipped.
    res.send({
      success: true,
      message: "Sessions updated successfully.",
      modifiedCount: result.modifiedCount,
      skipped: skippedSessions,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;

function checkBookingValidity(booking, trainerSchedule) {
  const notFoundIds = [];
  const fullIds = [];

  // Loop through each session in the booking.
  for (let sessionId of booking.sessions) {
    let found = false;
    let sessionFull = false;

    for (let day in trainerSchedule) {
      for (let time in trainerSchedule[day]) {
        const session = trainerSchedule[day][time];
        if (session.id === sessionId) {
          found = true;
          const participantCount = session.participant
            ? Object.keys(session.participant).length
            : 0;
          if (participantCount >= session.participantLimit) {
            sessionFull = true;
          }
          break; // Stop looking at times once found
        }
      }
      if (found) break; // Stop looking at days once found
    }

    if (!found) {
      notFoundIds.push(sessionId);
    } else if (sessionFull) {
      fullIds.push(sessionId);
    }
  }

  // Compose result
  if (notFoundIds.length > 0) {
    return {
      valid: false,
      reason: `wrong class selected for session id: ${notFoundIds.join(", ")}`,
    };
  }

  if (fullIds.length > 0) {
    return {
      valid: false,
      reason: `class full for session id: ${fullIds.join(", ")}`,
    };
  }

  return { valid: true };
}
