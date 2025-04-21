const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

const UsersCollection = client.db("Seven-Gym").collection("Users");

// Utility: Convert "dd-mm-yyyy" to a Date object
function parseDDMMYYYY(dateStr) {
  const [day, month, year] = dateStr.split("-");
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) throw new Error(`Invalid date: ${dateStr}`);
  return date;
}

// Utility: Add a duration string like "1 Month", "3 Days", etc. to a Date
function addDuration(startDate, durationStr) {
  const [numStr, unit] = durationStr.split(" ");
  const num = parseInt(numStr);
  if (isNaN(num)) throw new Error(`Invalid duration: ${durationStr}`);

  const date = new Date(startDate);

  // Adjust date based on duration unit
  switch (unit.toLowerCase()) {
    case "day":
    case "days":
      date.setDate(date.getDate() + num);
      break;
    case "month":
    case "months":
      date.setMonth(date.getMonth() + num);
      break;
    case "year":
    case "years":
      date.setFullYear(date.getFullYear() + num);
      break;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }

  return date;
}

// Utility: Format date to "YYYY-MM-DD" for comparison
function formatDateISO(date) {
  return date.toISOString().split("T")[0];
}

// Core Logic: Check all users for expired tiers and downgrade if needed
async function checkExpiredTiers() {
  console.log("Starting Tier Expiry Check...");

  try {
    const today = new Date();
    const todayISO = formatDateISO(today);

    // Fetch all users
    const users = await UsersCollection.find().toArray();

    for (const user of users) {
      const tier = user.tier;
      const tierData = user.tierDuration;

      // Skip users with no tier, already Bronze, or no tier data
      if (!tier || tier === "Bronze" || !tierData) continue;

      let endDate;

      try {
        if (tierData.end) {
          // Use end date if provided
          endDate = parseDDMMYYYY(tierData.end);
        } else if (tierData.start && tierData.duration) {
          // If no end date, calculate it using start + duration
          const startDate = parseDDMMYYYY(tierData.start);
          endDate = addDuration(startDate, tierData.duration);
        } else {
          // Invalid tier data
          console.warn(`User ${user.email} missing tier dates.`);
          continue;
        }
      } catch (err) {
        // Log if date parsing fails
        console.error(`Date error for ${user.email}:`, err.message);
        continue;
      }

      const endISO = formatDateISO(endDate);

      // If tier has expired
      if (endISO <= todayISO) {
        // Downgrade user to Bronze and remove tier info
        await UsersCollection.updateOne(
          { _id: user._id },
          {
            $set: { tier: "Bronze" },
            $unset: { tierDuration: "" },
          }
        );
        console.log(`Downgraded ${user.email} to Bronze.`);
      }
    }

    console.log("Tier Expiry Check Completed.");
  } catch (err) {
    console.error("Error in Tier Expiry Check:", err);
  }
}

// Scheduler: Runs daily at 00:00 (midnight)
cron.schedule("0 0 * * *", () => {
  console.log("Running Scheduled Tier Expiry Check...");
  checkExpiredTiers();
});

// API: Basic status check
router.get("/", (req, res) => {
  res.send("Tier expiration cron is active.");
});

// API: Manual trigger for testing/admin use
router.get("/RunNow", async (req, res) => {
  await checkExpiredTiers();
  res.send("Manual tier check completed.");
});

module.exports = router;
