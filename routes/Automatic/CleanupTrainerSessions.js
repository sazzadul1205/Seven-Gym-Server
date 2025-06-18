const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const dayjs = require("dayjs");
const { client } = require("../../config/db");

const Trainers_ScheduleCollection = client
  .db("Seven-Gym")
  .collection("Trainers_Schedule");

console.log("[TrainerCleanup] Cron Job Initialized");

// Core Logic: Remove expired participants
async function cleanupExpiredTrainerSessions() {
  const now = dayjs();
  const logs = [];

  try {
    const schedules = await Trainers_ScheduleCollection.find({}).toArray();

    for (const schedule of schedules) {
      let updated = false;
      const trainerName = schedule.trainerName || "Unknown";
      const updatedSessions = [];

      for (const day in schedule.trainerSchedule) {
        const slots = schedule.trainerSchedule[day];

        for (const time in slots) {
          const session = slots[time];

          if (Array.isArray(session.participant)) {
            const original = session.participant.length;
            const filtered = session.participant.filter((p) => {
              if (!p.startAt || !p.duration) return true;
              const endDate = dayjs(p.startAt, "DD-MMMM-YYYY").add(
                p.duration * 7,
                "day"
              );
              return endDate.isAfter(now);
            });

            if (filtered.length !== original) {
              updated = true;
              updatedSessions.push({
                day,
                time,
                before: original,
                after: filtered.length,
              });
            }

            session.participant = filtered.length > 0 ? filtered : {};
          } else {
            if (
              session.participant &&
              typeof session.participant !== "object"
            ) {
              session.participant = {};
              updated = true;
            }
          }
        }
      }

      if (updated) {
        await Trainers_ScheduleCollection.updateOne(
          { _id: schedule._id },
          { $set: { trainerSchedule: schedule.trainerSchedule } }
        );

        logs.push({
          trainerName,
          trainerId: schedule._id,
          updatedSessions,
        });

        console.log(
          `[TrainerCleanup] Cleaned expired participants for ${trainerName} (${schedule._id})`
        );
      }
    }

    if (logs.length === 0) {
      console.log("[TrainerCleanup] No expired participants found.");
    }

    return logs;
  } catch (error) {
    console.error("[TrainerCleanup] Error:", error.message);
    return { error: error.message };
  }
}

// Cron: Daily at 2:00 AM
cron.schedule("0 2 * * *", async () => {
  console.log("[TrainerCleanup] Scheduled cleanup started...");
  const result = await cleanupExpiredTrainerSessions();
  logCleanupResult(result);
});

// Logger Helper
function logCleanupResult(result) {
  if (Array.isArray(result) && result.length > 0) {
    result.forEach((entry) => {
      console.log(
        `[TrainerCleanup] Updated ${entry.trainerName} (${entry.trainerId}):`
      );
      entry.updatedSessions.forEach((session) => {
        console.log(
          `  - ${session.day} @ ${session.time}: ${session.before} → ${session.after}`
        );
      });
    });
  } else if (result?.error) {
    console.error(`[TrainerCleanup] Error: ${result.error}`);
  } else {
    console.log("[TrainerCleanup] No updates performed.");
  }
}

// Health route
router.get("/", (req, res) => {
  res.send("Trainer session cleanup cron job is active.");
});

// Status route
router.get("/status", (req, res) => {
  res.send("Trainer session cleanup runs daily at 02:00 AM.");
});

// Manual run
router.get("/RunNow", async (req, res) => {
  const result = await cleanupExpiredTrainerSessions();
  logCleanupResult(result);

  if (Array.isArray(result) && result.length > 0) {
    return res.json({
      message: "Trainer session cleanup completed.",
      updated: result,
    });
  }

  if (result?.error) {
    return res.status(500).json({
      message: "Error during trainer session cleanup.",
      error: result.error,
    });
  }

  res.json({ message: "No trainer sessions needed cleanup." });
});

module.exports = router;
