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

// Update Favorite Status
// router.post("/api/updateFavoriteStatus", async (req, res) => {
//   const { email, award } = req.body;

//   if (!email || !award) {
//     return res.status(400).json({ message: "Invalid request data. 'email' and 'award' are required." });
//   }

//   try {
//     const user = await UsersCollection.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Check if the 'awards' field exists in the user document
//     if (!user.awards) {
//       // Add the 'awards' field if it doesn't exist
//       await UsersCollection.updateOne(
//         { email },
//         {
//           $set: { awards: [] },
//         }
//       );
//     }

//     // Check if the award already exists
//     const existingAwardIndex = user.awards?.findIndex((item) => item._id === award._id);

//     if (existingAwardIndex >= 0) {
//       // Update the existing award's favorite status
//       await UsersCollection.updateOne(
//         {
//           email,
//           "awards._id": new ObjectId(award._id),
//         },
//         {
//           $set: {
//             "awards.$.favorite": award.favorite,
//           },
//         }
//       );
//     } else {
//       // Add the new award to the 'awards' array
//       await UsersCollection.updateOne(
//         { email },
//         {
//           $push: {
//             awards: {
//               ...award,
//               _id: new ObjectId(award._id), // Ensure `_id` is an ObjectId
//             },
//           },
//         }
//       );
//     }

//     res.status(200).json({ message: "Favorite status updated successfully." });
//   } catch (error) {
//     console.error("Error updating favorite status:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// });

module.exports = router;
