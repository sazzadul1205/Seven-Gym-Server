const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

// Collection for Users
const UsersCollection = client.db("Seven-Gym").collection("Users");

// Utility function to delete old workouts
async function deleteOldWorkouts() {
  console.log("Maintenance: Deleting workouts older than 7 days...");
  try {
    const today = new Date();
    today.setDate(today.getDate() - 7); // Calculate date 7 days ago
    const cutoffDate = today.toISOString(); // Convert it to ISO string for comparison

    // Fetch all users
    const users = await UsersCollection.find().toArray();

    for (const user of users) {
      if (user.recentWorkouts && user.recentWorkouts.length > 0) {
        // Filter workouts that are older than 7 days based on registeredDateAndTime
        const updatedWorkouts = user.recentWorkouts.filter(
          (workout) =>
            new Date(workout.registeredDateAndTime) >= new Date(cutoffDate)
        );

        // Update the user's recentWorkouts array with only the valid workouts (within the last 7 days)
        await UsersCollection.updateOne(
          { _id: user._id },
          { $set: { recentWorkouts: updatedWorkouts } }
        );
      }
    }

    console.log("Maintenance: Old workouts deletion completed successfully.");
  } catch (error) {
    console.error("Error deleting old workouts:", error);
    console.log("Maintenance: Old workouts deletion encountered errors.");
  }
}

// Set up the cron job to run daily at midnight (00:00)
cron.schedule("0 0 * * *", () => {
  console.log("Scheduled maintenance is starting...");
  deleteOldWorkouts();
  console.log("Scheduled maintenance completed.");
});

// Basic route to confirm the cron job is running
router.get("/", (req, res) => {
  res.send("Cron job for deleting old workouts is running.");
});

// Maintenance status route (optional)
router.get("/status", (req, res) => {
  res.send("Scheduled maintenance is set to run daily at midnight.");
});

console.log("Delete Old Workouts is running");

module.exports = router;
