const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

// Collection for Users
const UsersCollection = client.db("Seven-Gym").collection("Users");

// Utility function to check for expired tiers
async function checkExpiredTiers() {
  console.log("Maintenance: Tier expiration check is starting...");
  try {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in 'YYYY-MM-DD' format

    // Fetch all users from the database
    const users = await UsersCollection.find().toArray();

    for (const user of users) {
      if (
        user.tierDuration &&
        user.tierDuration.end &&
        user.tierDuration.end.split("T")[0] === today
      ) {
        // Update user's tier to "Bronze" and remove the tierDuration
        await UsersCollection.updateOne(
          { _id: user._id },
          {
            $set: { tier: "Bronze" },
            $unset: { tierDuration: "" }, // Remove tierDuration field
          }
        );

        console.log(
          `User ${user.email}'s tier expired. Tier updated to Bronze.`
        );

        // Optional: Add additional notifications (e.g., email or push notification)
      }
    }

    console.log("Maintenance: Tier expiration check completed successfully.");
  } catch (error) {
    console.error("Error checking for expired tiers:", error);
    console.log("Maintenance: Tier expiration check encountered errors.");
  }
}

// Set up the cron job to run daily at midnight (00:00)
cron.schedule("0 0 * * *", () => {
  console.log("Scheduled maintenance is starting...");
  checkExpiredTiers();
  console.log("Scheduled maintenance completed.");
});

// Basic route to confirm the cron job is running
router.get("/", (req, res) => {
  res.send("Cron job for checking expired tiers is running.");
});

// Maintenance status route (optional)
router.get("/status", (req, res) => {
  res.send("Scheduled maintenance is set to run daily at midnight.");
});
console.log("CheckExpiredTiers.js is running");

module.exports = router;
