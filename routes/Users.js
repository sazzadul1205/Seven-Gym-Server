const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Users
const UsersCollection = client.db("Seven-Gym").collection("Users");

// Get Users (with optional email query)
router.get("/", async (req, res) => {
  try {
    const email = req.query.email; // Get email query parameter

    let result;
    if (email) {
      // Search for a specific user by email
      result = await UsersCollection.findOne({ email });
      if (!result) {
        return res.status(404).send({
          message: "User not found.",
        });
      }
    } else {
      // If no email is provided, fetch all users
      result = await UsersCollection.find().toArray();
    }

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching Users:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Create User (POST API)
router.post("/", async (req, res) => {
  try {
    const userData = req.body; // Extract user data from the request body

    // Check if email already exists
    const existingUser = await UsersCollection.findOne({
      email: userData.email,
    });
    if (existingUser) {
      return res.status(400).send({
        message: "The email is already in use. Please use a different email.",
      });
    }

    // Insert new user
    const result = await UsersCollection.insertOne(userData);

    // Ensure the inserted data is sent in the response
    const insertedUser = result.ops ? result.ops[0] : result.insertedId; // For MongoDB 4.0+ compatibility

    res.status(201).send({
      message: "User created successfully!",
      data: insertedUser, // Send the inserted user data
    });
  } catch (error) {
    console.error("Error creating User:", error);
    res.status(500).send("Failed to create user. Please try again.");
  }
});

// Check if email exists (GET API)
router.get("/check-email", async (req, res) => {
  try {
    const email = req.query.email; // Get the email from query parameters

    if (!email) {
      return res.status(400).send({
        message: "Email parameter is required.",
      });
    }

    // Search for the email in the Users collection
    const existingUser = await UsersCollection.findOne({ email });

    if (existingUser) {
      return res.status(200).send({
        message: "Email is already in use.",
        exists: true,
      });
    } else {
      return res.status(200).send({
        message: "Email is available.",
        exists: false,
      });
    }
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).send({
      message: "Failed to check email. Please try again.",
    });
  }
});

module.exports = router;
