const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// Middle Ware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@seven-gym.66u29.mongodb.net/?retryWrites=true&w=majority&appName=Seven-Gym`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Connections
    const Home_Banner_SectionCollection = client
      .db("Seven-Gym")
      .collection("Home_Banner_Section");
    const Home_Welcome_SectionCollection = client
      .db("Seven-Gym")
      .collection("Home_Welcome_Section");
    const Home_Services_SectionCollection = client
      .db("Seven-Gym")
      .collection("Home_Services_Section");
    const Our_ClassesCollection = client
      .db("Seven-Gym")
      .collection("Our_Classes");
    const Class_DetailsCollection = client
      .db("Seven-Gym")
      .collection("Class_Details");
    const TrainersCollection = client.db("Seven-Gym").collection("Trainers");
    const TestimonialsCollection = client
      .db("Seven-Gym")
      .collection("Testimonials");
    const GalleryCollection = client.db("Seven-Gym").collection("Gallery");
    const PromotionsCollection = client
      .db("Seven-Gym")
      .collection("Promotions");
    const Gym_FeaturesCollection = client
      .db("Seven-Gym")
      .collection("Gym_Features");

    // API'S

    // Home_Banner_Section API
    // Get Home_Banner_Section
    app.get("/Home_Banner_Section", async (req, res) => {
      const result = await Home_Banner_SectionCollection.find().toArray();
      res.send(result);
    });

    // Home_Welcome_Section API
    // Get Home_Welcome_Section
    app.get("/Home_Welcome_Section", async (req, res) => {
      const result = await Home_Welcome_SectionCollection.find().toArray();
      res.send(result);
    });

    // Home_Services_Section API
    // Get Home_Services_Section
    app.get("/Home_Services_Section", async (req, res) => {
      const result = await Home_Services_SectionCollection.find().toArray();
      res.send(result);
    });

    // Our_Classes API
    // Get Our_Classes
    app.get("/Our_Classes", async (req, res) => {
      const result = await Our_ClassesCollection.find().toArray();
      res.send(result);
    });

    // Class_Details API
    // Get Class_Details
    app.get("/Class_Details", async (req, res) => {
      const result = await Class_DetailsCollection.find().toArray();
      res.send(result);
    });

    // Trainers API
    // Get Trainers
    app.get("/Trainers", async (req, res) => {
      const result = await TrainersCollection.find().toArray();
      res.send(result);
    });

    // Testimonials API
    // Get Testimonials
    app.get("/Testimonials", async (req, res) => {
      const result = await TestimonialsCollection.find().toArray();
      res.send(result);
    });

    // Gallery API
    // Get Gallery
    app.get("/Gallery", async (req, res) => {
      const result = await GalleryCollection.find().toArray();
      res.send(result);
    });

    // Promotions API
    // Get Promotions
    app.get("/Promotions", async (req, res) => {
      const result = await PromotionsCollection.find().toArray();
      res.send(result);
    });

    // Gym_Features API
    // Get Gym_Features
    app.get("/Gym_Features", async (req, res) => {
      const result = await Gym_FeaturesCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Set up the basic route
app.get("/", (req, res) => {
  res.send("Seven Gym is Running");
});

// Listen on the specified port
app.listen(port, () => {
  console.log(`Seven Gym is Running on Port: ${port}`);
});
