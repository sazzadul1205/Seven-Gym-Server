const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Class Booking Accepted
const Class_Booking_AcceptedCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Accepted");

// GET : Get all Class Booking Accepted
router.get("/", async (req, res) => {
  try {
    const result = await Class_Booking_AcceptedCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Class Booking Accepted Data:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT : Update a Class Booking Accepted by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || !updateData) {
      return res.status(400).send("Missing ID or update data.");
    }

    const result = await Class_Booking_AcceptedCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .send("No booking accepted record found with that ID.");
    }

    res.send({
      message: "Booking accepted updated successfully.",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating Class Booking Accepted:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST : post Accepted to create a new booking Accepted
router.post("/", async (req, res) => {
  try {
    const newRequest = req.body;

    if (!newRequest) {
      return res.status(400).send("Invalid Accepted data.");
    }

    const result = await Class_Booking_AcceptedCollection.insertOne(newRequest);

    // Check if the insertedId exists
    if (result.insertedId) {
      res.status(201).send({
        message: "Booking Accepted created successfully.",
        requestId: result.insertedId,
      });
    } else {
      res.status(500).send("Error creating booking Accepted.");
    }
  } catch (error) {
    console.error("Error creating Class Booking Accepted:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE: Delete a specific Class Booking Accepted by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send("Invalid ID format.");
    }

    const result = await Class_Booking_AcceptedCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send("No booking found with that ID.");
    }

    res.send({
      message: "Booking Accepted deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting Class Booking Accepted by ID:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE: Delete all Class Booking Accepted entries
// router.delete("/DeleteAll", async (req, res) => {
//   try {
//     const result = await Class_Booking_AcceptedCollection.deleteMany({});
//     res.send({
//       message: "All accepted class bookings deleted successfully.",
//       deletedCount: result.deletedCount,
//     });
//   } catch (error) {
//     console.error("Error deleting Class Booking Accepted data:", error);
//     res.status(500).send("Something went wrong.");
//   }
// });

module.exports = router;
