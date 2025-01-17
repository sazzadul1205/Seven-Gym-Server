// Import required modules
const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

// Collection for Users
const UsersCollection = client.db("Seven-Gym").collection("Users");

// Get Users (with optional email query)
router.get("/", async (req, res) => {
  try {
    const email = req.query.email;

    if (email) {
      const result = await UsersCollection.findOne({ email });
      if (!result) {
        return res.status(404).json({ message: "User not found." });
      }
      return res.status(200).json(result);
    }

    const result = await UsersCollection.find().toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Check if email exists (GET API)
router.get("/check-email", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ message: "Email parameter is required." });
    }

    const existingUser = await UsersCollection.findOne({ email });
    res.status(200).json({
      message: existingUser
        ? "Email is already in use."
        : "Email is available.",
      exists: !!existingUser,
    });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Create User (POST API)
router.post("/", async (req, res) => {
  try {
    const userData = req.body;

    if (!userData.email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const existingUser = await UsersCollection.findOne({
      email: userData.email,
    });
    if (existingUser) {
      return res.status(400).json({ message: "The email is already in use." });
    }

    const result = await UsersCollection.insertOne(userData);

    res.status(201).json({
      message: "User created successfully!",
      data: { id: result.insertedId, ...userData },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Endpoint to add an award to a user's data
router.post("/Add_Award", async (req, res) => {
  try {
    const { email, award } = req.body;

    if (!email || !award) {
      return res
        .status(400)
        .json({ message: "Email and award data are required." });
    }

    const user = await UsersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the user has an awards array; if not, initialize it
    if (!user.awards) {
      user.awards = [];
    }

    // Add the new award to the awards array
    user.awards.push(award);

    // Update the user data in the database
    const updateResult = await UsersCollection.updateOne(
      { email },
      { $set: { awards: user.awards } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ message: "Failed to add the award." });
    }

    res.status(200).json({ message: "Award added successfully." });
  } catch (error) {
    console.error("Error adding award:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Update User Data (PATCH API)
router.patch("/", async (req, res) => {
  try {
    const { email, ...updateData } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required for the update." });
    }

    const user = await UsersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const result = await UsersCollection.updateOne(
      { email },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: "User data was not updated." });
    }

    res.status(200).json({ message: "User data updated successfully." });
  } catch (error) {
    console.error("Error updating user data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Update User Tier (PUT API)
router.put("/Update_User_Tier", async (req, res) => {
  try {
    const { email, tier, updateTierStart, updateTierEnd, duration } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await UsersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const updateData = {
      ...(tier && { tier }),
      ...(updateTierStart &&
        updateTierEnd &&
        duration && {
          tierDuration: {
            duration,
            start: updateTierStart,
            end: updateTierEnd,
          },
        }),
    };

    const result = await UsersCollection.updateOne(
      { email },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: "User data was not updated." });
    }

    res.status(200).json({ message: "User tier updated successfully." });
  } catch (error) {
    console.error("Error updating user tier:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Toggle favorite status for an award with a limit of 5
router.put("/toggle-award-favorite", async (req, res) => {
  try {
    const { email, awardCode } = req.body;

    if (!email || !awardCode) {
      return res.status(400).json({ message: "Missing email or awardCode." });
    }

    const user = await UsersCollection.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const awardIndex = user.awards.findIndex(
      (award) => award.awardCode === awardCode
    );
    if (awardIndex === -1)
      return res.status(404).json({ message: "Award not found." });

    const isFavorite = user.awards[awardIndex].favorite;
    const favoritesCount = user.awards.filter((award) => award.favorite).length;

    if (!isFavorite && favoritesCount >= 5) {
      return res.status(400).json({ message: "Limit of 5 favorites reached." });
    }

    const updateField = `awards.${awardIndex}.favorite`;
    const result = await UsersCollection.updateOne(
      { email },
      { $set: { [updateField]: !isFavorite } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Updated successfully!" });
    } else {
      res.status(500).json({ message: "Failed to update." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

// Delete an award by awardCode
router.delete("/delete-award", async (req, res) => {
  try {
    const { email, awardCode } = req.body;

    // Validate request
    if (!email || !awardCode) {
      return res.status(400).json({ message: "Missing email or awardCode." });
    }

    // Find the user
    const user = await UsersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the award exists
    const awardIndex = user.awards.findIndex(
      (award) => award.awardCode === awardCode
    );
    if (awardIndex === -1) {
      return res.status(404).json({ message: "Award not found." });
    }

    // Remove the award from the user's awards array
    const result = await UsersCollection.updateOne(
      { email },
      { $pull: { awards: { awardCode } } }
    );

    // Check if the award was successfully removed
    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Award deleted successfully!" });
    } else {
      res.status(500).json({ message: "Failed to delete award." });
    }
  } catch (error) {
    console.error("Error deleting award:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
