const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Testimonials
const TestimonialsCollection = client
  .db("Seven-Gym")
  .collection("Testimonials");

// Get Testimonials
router.get("/", async (req, res) => {
  try {
    const result = await TestimonialsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Testimonials:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
