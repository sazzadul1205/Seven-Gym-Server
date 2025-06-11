const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

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

// Get: user's name, profile image, email, gender, DOB, and tier
router.get("/BasicProfile", async (req, res) => {
  try {
    const email = req.query.email;

    const projection = {
      profileImage: 1,
      fullName: 1,
      gender: 1,
      email: 1,
      role: 1,
      tier: 1,
      dob: 1,
      _id: 1,
    };

    if (email) {
      const user = await UsersCollection.findOne({ email }, { projection });

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      return res.status(200).json(user);
    } else {
      const users = await UsersCollection.find({}, { projection }).toArray();
      return res.status(200).json(users);
    }
  } catch (error) {
    console.error("Error fetching basic profile(s):", error);
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

// If Email is Given I will get the Role
router.get("/UserRole", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email query parameter is required." });
    }

    const user = await UsersCollection.findOne(
      { email },
      { projection: { role: 1, _id: 0 } } // only fetch role, exclude _id
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ role: user.role });
  } catch (error) {
    console.error("Error fetching user role:", error);
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

// Endpoint to add a workout to a user's recentWorkouts
router.post("/Add_Workout", async (req, res) => {
  try {
    const { email, workout } = req.body;

    // Validate request data
    if (!email || !workout) {
      return res
        .status(400)
        .json({ message: "Email and workout data are required." });
    }

    // Find the user by email
    const user = await UsersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the user has a recentWorkouts array; if not, initialize it
    if (!user.recentWorkouts) {
      user.recentWorkouts = [];
    }

    // Add the new workout to the recentWorkouts array
    user.recentWorkouts.push(workout);

    // Update the user data in the database
    const updateResult = await UsersCollection.updateOne(
      { email },
      { $set: { recentWorkouts: user.recentWorkouts } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ message: "Failed to add the workout." });
    }

    res.status(200).json({ message: "Workout added successfully." });
  } catch (error) {
    console.error("Error adding workout:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// POST : Add Ban Info to a User
router.post("/AddBanElement/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format." });
    }

    const banData = req.body;

    if (!banData || typeof banData !== "object") {
      return res.status(400).json({ error: "Ban data is missing or invalid." });
    }

    const updateResult = await UsersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ban: banData } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ message: "User banned successfully." });
  } catch (error) {
    console.error("Error banning user:", error.message);
    res.status(500).json({ error: "Failed to ban user." });
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

// PATCH : Remove Ban Info from a User
router.patch("/UnBan/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format." });
    }

    const updateResult = await UsersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $unset: { ban: "" } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ message: "User unbanned successfully." });
  } catch (error) {
    console.error("Error unbanning user:", error.message);
    res.status(500).json({ error: "Failed to unban user." });
  }
});

// Update User Tier (PUT API)
router.put("/Update_User_Tier", async (req, res) => {
  try {
    const {
      email,
      tier,
      updateTierStart,
      updateTierEnd,
      duration,
      linkedReceptID,
    } = req.body;

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
            linkedReceptID,
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

    if (!isFavorite && favoritesCount >= 6) {
      return res.status(400).json({ message: "Limit of 6 favorites reached." });
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

// UPDATE : Trainer Role Update
router.put("/UpdateRole", async (req, res) => {
  try {
    const { id, email, role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }

    const filter = {};

    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID format." });
      }
      filter._id = new ObjectId(id);
    } else if (email) {
      filter.email = email;
    } else {
      return res
        .status(400)
        .json({ message: "Either id or email must be provided." });
    }

    const updateResult = await UsersCollection.updateOne(filter, {
      $set: { role },
    });

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User role updated successfully." });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Internal server error." });
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

// Delete a workout by workoutId
router.delete("/delete-workout", async (req, res) => {
  try {
    const { email, workoutId } = req.body;

    // Validate request
    if (!email || !workoutId) {
      return res.status(400).json({ message: "Missing email or workoutId." });
    }

    // Find the user
    const user = await UsersCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the workout exists
    const workoutIndex = user.recentWorkouts.findIndex(
      (workout) => workout.workoutId === workoutId
    );
    if (workoutIndex === -1) {
      return res.status(404).json({ message: "Workout not found." });
    }

    // Remove the workout from the user's recentWorkouts array
    const result = await UsersCollection.updateOne(
      { email },
      { $pull: { recentWorkouts: { workoutId } } }
    );

    // Check if the workout was successfully removed
    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Workout deleted successfully!" });
    } else {
      res.status(500).json({ message: "Failed to delete workout." });
    }
  } catch (error) {
    console.error("Error deleting workout:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE user by _id
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate the format of the ID
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const result = await UsersCollection.deleteOne({
      _id: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
