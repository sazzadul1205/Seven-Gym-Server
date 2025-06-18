const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Terms Of Service
const TermsOfServiceCollection = client
  .db("Seven-Gym")
  .collection("Terms_Of_Service");

// GET : Get Terms Of Service Data
router.get("/", async (req, res) => {
  try {
    const result = await TermsOfServiceCollection.findOne();
    if (!result) {
      return res.status(404).send("No Terms Of Service found.");
    }
    res.send(result);
  } catch (error) {
    console.error("Error fetching Terms Of Service:", error);
    res.status(500).send("Something went wrong.");
  }
});

// PUT : Update Terms Of Service by _id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: updateData,
    };

    const result = await TermsOfServiceCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "No Terms Of Service found with that ID." });
    }

    res.json({ message: "Terms Of Service updated successfully." });
  } catch (error) {
    console.error("Error updating Terms Of Service:", error);
    res.status(500).json({ message: "Failed to update Terms Of Service." });
  }
});

module.exports = router;
