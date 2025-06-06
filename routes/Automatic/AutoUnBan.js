const express = require("express");
const router = express.Router();
const cron = require("node-cron");
const { client } = require("../../config/db");

const UsersCollection = client.db("Seven-Gym").collection("Users");
const TrainersCollection = client.db("Seven-Gym").collection("Trainers");

console.log("🔁 Auto-UnBan Cron Job Initialized");

// 🔧 Core logic to unBan expired users/trainers
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

      console.log(`✅ Unbanned ${ids.length} from ${name}.`);
    }
  } catch (err) {
    console.error("❌ Error in auto-unBan task:", err.message);
  }
};

// 🕛 Schedule: Run daily at midnight
cron.schedule("0 0 * * *", () => {
  console.log("⏰ Running daily auto-unBan task...");
  AutoUnBanHandler();
});

// ✅ Health check route
router.get("/", (req, res) => {
  res.send("🟢 Auto-unBan cron job is active and runs daily at midnight.");
});

// ✅ Manual trigger for testing
router.get("/RunNow", async (req, res) => {
  await AutoUnBanHandler();
  res.send("✅ Manual unBan check completed.");
});

module.exports = router;
