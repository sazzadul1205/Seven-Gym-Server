const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { client } = require("../config/db");

// Collection for Testimonials
const TestimonialsCollection = client
  .db("Seven-Gym")
  .collection("Testimonials");

// GET Testimonials with optional filters
router.get("/", async (req, res) => {
  try {
    const { _id, name, email } = req.query;
    const query = {};

    if (_id) {
      try {
        query._id = new ObjectId(_id);
      } catch (err) {
        return res.status(400).send("Invalid _id format.");
      }
    }

    if (name) query.name = { $regex: new RegExp(name, "i") };
    if (email) query.email = { $regex: new RegExp(email, "i") };

    const result = await TestimonialsCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Testimonials:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST - Create a new testimonial
router.post("/", async (req, res) => {
  try {
    const { name, email, quote, imageUrl, role } = req.body;

    if (!name || !email || !quote || !imageUrl) {
      return res.status(400).send("Name, email, and quote are required.");
    }

    const newTestimonial = {
      name,
      email,
      quote,
      role: role || null, // Optional field
      imageUrl,
      createdAt: new Date(),
    };

    const result = await TestimonialsCollection.insertOne(newTestimonial);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error creating Testimonial:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT - Update a testimonial by _id
router.put("/:_id", async (req, res) => {
  const { _id } = req.params;

  if (!_id) {
    return res.status(400).send("Testimonial _id is required.");
  }

  try {
    const updatedData = req.body;

    const result = await TestimonialsCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send("Testimonial not found.");
    }

    res.send({ message: "Testimonial updated successfully.", result });
  } catch (error) {
    console.error("Error updating Testimonial:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE - Delete a testimonial by _id
router.delete("/:_id", async (req, res) => {
  const { _id } = req.params;

  if (!_id) {
    return res.status(400).send("Testimonial _id is required.");
  }

  try {
    const result = await TestimonialsCollection.deleteOne({
      _id: new ObjectId(_id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send("Testimonial not found.");
    }

    res.send({ message: "Testimonial deleted successfully." });
  } catch (error) {
    console.error("Error deleting Testimonial:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
