// /config/db.js
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@seven-gym.66u29.mongodb.net/?retryWrites=true&w=majority&appName=Seven-Gym`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const connectDB = async (retries = 100, delayTime = 5000) => {
  while (retries > 0) {
    try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("✅ Successfully connected to MongoDB!");
      return;
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err.message);
      retries--;
      if (retries > 0) {
        console.log(`🔁 Retrying in ${delayTime / 1000} seconds... (${retries} retries left)`);
        await delay(delayTime);
      } else {
        console.error("💥 All retries exhausted. MongoDB connection failed permanently.");
        process.exit(1); // Exit the process if connection completely fails
      }
    }
  }
};

module.exports = { client, connectDB };
