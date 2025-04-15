const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const dayjs = require("dayjs");
const { client } = require("../../config/db");

// Collection for Trainers_Schedule
const Trainers_ScheduleCollection = client
  .db("Seven-Gym")
  .collection("Trainers_Schedule");

// Utility function to clean expired participants
async function cleanupExpiredTrainerSessions() {
  console.log("Maintenance: Trainer session cleanup is starting...");

  try {
    const now = dayjs();
    const schedules = await Trainers_ScheduleCollection.find({}).toArray();

    for (const schedule of schedules) {
      let updated = false;

      for (const day in schedule.trainerSchedule) {
        const slots = schedule.trainerSchedule[day];

        for (const time in slots) {
          const session = slots[time];

          if (Array.isArray(session.participant)) {
            const filtered = session.participant.filter((p) => {
              if (!p.startAt || !p.duration) return true;

              const endDate = dayjs(p.startAt, "DD-MMMM-YYYY").add(
                p.duration * 7,
                "day"
              );
              return endDate.isAfter(now);
            });

            if (filtered.length !== session.participant.length) updated = true;

            session.participant = filtered.length > 0 ? filtered : {};
          } else if (typeof session.participant === "object") {
            // Do nothing — already clean
          } else {
            session.participant = {};
            updated = true;
          }
        }
      }

      if (updated) {
        await Trainers_ScheduleCollection.updateOne(
          { _id: schedule._id },
          { $set: { trainerSchedule: schedule.trainerSchedule } }
        );
        console.log(
          `Trainer schedule updated for ${schedule.trainerName || schedule._id}`
        );
      }
    }

    console.log("Maintenance: Trainer session cleanup completed.");
  } catch (error) {
    console.error("Error during trainer session cleanup:", error);
    console.log("Maintenance: Trainer session cleanup encountered errors.");
  }
}

// Schedule cron job to run daily at 02:00 AM
cron.schedule("0 2 * * *", () => {
  console.log("Scheduled trainer session cleanup is starting...");
  cleanupExpiredTrainerSessions();
  console.log("Scheduled trainer session cleanup finished.");
});

// Base route
router.get("/", (req, res) => {
  res.send("Trainer session cleanup cron job is active.");
});

// Optional status route
router.get("/status", (req, res) => {
  res.send("Trainer session cleanup runs daily at 02:00 AM.");
});

// Manual trigger
router.get("/RunNow", async (req, res) => {
  await cleanupExpiredTrainerSessions();
  res.send("Manual trainer session cleanup complete.");
});

console.log("Trainer session cleanup cron is running");

module.exports = router;
