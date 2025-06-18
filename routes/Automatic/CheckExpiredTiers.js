const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

const UsersCollection = client.db("Seven-Gym").collection("Users");

// Utility: Convert "dd-mm-yyyy" to Date
function parseDDMMYYYY(dateStr) {
  const [day, month, year] = dateStr.split("-");
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) throw new Error(`Invalid date: ${dateStr}`);
  return date;
}

// Utility: Add duration to date
function addDuration(startDate, durationStr) {
  const [numStr, unit] = durationStr.split(" ");
  const num = parseInt(numStr);
  if (isNaN(num)) throw new Error(`Invalid duration: ${durationStr}`);

  const date = new Date(startDate);

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

// Utility: Format to YYYY-MM-DD
function formatDateISO(date) {
  return date.toISOString().split("T")[0];
}

// Logging function
const logTierResult = (result) => {
  if (Array.isArray(result) && result.length > 0) {
    console.log(`[TierExpiry] ${result.length} user(s) downgraded:`);
    result.forEach(({ email, downgradedAt }) => {
      console.log(`- ${email} at ${downgradedAt}`);
    });
  } else if (result?.error) {
    console.error(`[TierExpiry] Error: ${result.error}`);
  } else {
    console.log("[TierExpiry] No tier downgrades needed.");
  }
};

// Core Logic
async function checkExpiredTiers() {
  try {
    const today = new Date();
    const todayISO = formatDateISO(today);
    const downgraded = [];

    const users = await UsersCollection.find().toArray();

    for (const user of users) {
      const tier = user.tier;
      const tierData = user.tierDuration;

      if (!tier || tier === "Bronze" || !tierData) continue;

      let endDate;
      try {
        if (tierData.end) {
          endDate = parseDDMMYYYY(tierData.end);
        } else if (tierData.start && tierData.duration) {
          const startDate = parseDDMMYYYY(tierData.start);
          endDate = addDuration(startDate, tierData.duration);
        } else {
          console.warn(`User ${user.email} missing tier dates.`);
          continue;
        }
      } catch (err) {
        console.error(`Date error for ${user.email}:`, err.message);
        continue;
      }

      const endISO = formatDateISO(endDate);
      if (endISO <= todayISO) {
        await UsersCollection.updateOne(
          { _id: user._id },
          {
            $set: { tier: "Bronze" },
            $unset: { tierDuration: "" },
          }
        );

        downgraded.push({
          email: user.email,
          downgradedAt: new Date().toISOString(),
        });
      }
    }

    return downgraded;
  } catch (err) {
    return { error: err.message };
  }
}

// Scheduler
cron.schedule("0 0 * * *", async () => {
  console.log("[TierExpiry] Running scheduled check...");
  const result = await checkExpiredTiers();
  logTierResult(result);
});

// Health Check
router.get("/", (req, res) => {
  res.send("Tier expiration cron is active.");
});

// Manual Trigger
router.get("/RunNow", async (req, res) => {
  const result = await checkExpiredTiers();
  logTierResult(result);

  if (Array.isArray(result) && result.length > 0) {
    return res.json({
      message: `${result.length} user(s) downgraded to Bronze.`,
      downgraded: result,
    });
  }

  if (result?.error) {
    return res
      .status(500)
      .json({ message: "Error in tier check", error: result.error });
  }

  res.json({
    message: "Manual tier check completed. No users downgraded.",
    downgraded: [],
  });
});

module.exports = router;
