const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

const UsersCollection = client.db("Seven-Gym").collection("Users");

console.log("DeleteOldWorkouts job initialized");

// Utility: Main handler function
async function deleteOldWorkouts() {
  const deletedLogs = [];
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(now.getDate() - 7);
  const cutoffISO = cutoff.toISOString();

  try {
    const users = await UsersCollection.find().toArray();

    for (const user of users) {
      const workouts = user.recentWorkouts || [];
      const validWorkouts = workouts.filter(
        (w) => new Date(w.registeredDateAndTime) >= new Date(cutoffISO)
      );

      // If deletion occurred
      if (validWorkouts.length < workouts.length) {
        await UsersCollection.updateOne(
          { _id: user._id },
          { $set: { recentWorkouts: validWorkouts } }
        );

        deletedLogs.push({
          email: user.email,
          removedCount: workouts.length - validWorkouts.length,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return deletedLogs;
  } catch (err) {
    return { error: err.message };
  }
}

// Logger
function logWorkoutCleanup(result) {
  if (Array.isArray(result) && result.length > 0) {
    console.log(`[WorkoutCleanup] ${result.length} user(s) cleaned up:`);
    result.forEach(({ email, removedCount, updatedAt }) => {
      console.log(
        `- ${email}: ${removedCount} workout(s) removed at ${updatedAt}`
      );
    });
  } else if (result?.error) {
    console.error(`[WorkoutCleanup] Error: ${result.error}`);
  } else {
    console.log("[WorkoutCleanup] No old workouts found.");
  }
}

// Cron job: runs daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("[WorkoutCleanup] Scheduled cleanup starting...");
  const result = await deleteOldWorkouts();
  logWorkoutCleanup(result);
});

// Basic check
router.get("/", (req, res) => {
  res.send("Old workout cleanup cron is active.");
});

// Manual route
router.get("/RunNow", async (req, res) => {
  const result = await deleteOldWorkouts();
  logWorkoutCleanup(result);

  if (Array.isArray(result) && result.length > 0) {
    return res.json({
      message: `${result.length} user(s) had workouts cleaned.`,
      cleaned: result,
    });
  }

  if (result?.error) {
    return res
      .status(500)
      .json({ message: "Error during workout cleanup", error: result.error });
  }

  res.json({
    message: "Manual cleanup complete. No old workouts found.",
    cleaned: [],
  });
});

module.exports = router;
