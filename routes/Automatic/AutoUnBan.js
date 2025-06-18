const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

const UsersCollection = client.db("Seven-Gym").collection("Users");
const TrainersCollection = client.db("Seven-Gym").collection("Trainers");

console.log("Auto-UnBan Cron Job Initialized");

//  Core logic to unBan expired users/trainers
const AutoUnBanHandler = async () => {
  try {
    const now = new Date();

    const collections = [
      { name: "Users", collection: UsersCollection },
      { name: "Trainers", collection: TrainersCollection },
    ];

    for (const { name, collection } of collections) {
      const bannedDocs = await collection
        .find({ ban: { $exists: true } })
        .toArray();

      const toUnBan = bannedDocs.filter((doc) => {
        if (!doc.ban?.End) return false;

        const endVal = doc.ban.End.toString().toLowerCase();
        const durationVal = doc.ban.Duration?.toString().toLowerCase();

        // Skip if Permanent or Indefinite
        if (endVal === "indefinite" || durationVal === "permanent") {
          return false;
        }

        const banEndDate = new Date(doc.ban.End);

        // UnBan if ban end date is before or equal to now (expired)
        return banEndDate <= now;
      });

      if (toUnBan.length === 0) {
        console.log(`📭 No expired bans in ${name} collection.`);
        continue;
      }

      const ids = toUnBan.map((doc) => doc._id);

      console.log(`⏳ Unbanning ${ids.length} from ${name}:`, ids);

      await collection.updateMany(
        { _id: { $in: ids } },
        { $unset: { ban: "" } }
      );

      console.log(` Unbanned ${ids.length} from ${name}.`);
    }
  } catch (err) {
    console.error(" Error in auto-unBan task:", err.message);
  }
};

// Shared logging function
const logUnBanResult = (result) => {
  if (Array.isArray(result) && result.length > 0) {
    console.log(`[AutoUnBan] ${result.length} account(s) unbanned:`);
    result.forEach(({ email, role, unbannedAt }) => {
      console.log(`- ${email} [${role}] at ${unbannedAt}`);
    });
  } else if (result?.error) {
    console.error(`[AutoUnBan] Error: ${result.error}`);
  } else {
    console.log("[AutoUnBan] No accounts were unbanned.");
  }
};

// Schedule: Run daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("[AutoUnBan] Running scheduled un Ban check...");
  const result = await AutoUnBanHandler();
  logUnBanResult(result);
});

// Health check route
router.get("/", (req, res) => {
  res.send("Auto-unBan cron job is active and runs daily at midnight.");
});

// Manual trigger for testing
router.get("/RunNow", async (req, res) => {
  const result = await AutoUnBanHandler();
  logUnBanResult(result);

  if (Array.isArray(result) && result.length > 0) {
    return res.json({
      message: `${result.length} user(s)/trainer(s) unbanned.`,
      unbanned: result,
    });
  }

  if (result?.error) {
    return res
      .status(500)
      .json({ message: "Error during Un Ban process.", error: result.error });
  }

  res.json({
    message: "Manual Un Ban check completed. No accounts were unbanned.",
    unbanned: [],
  });
});

module.exports = router;
