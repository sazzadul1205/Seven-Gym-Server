const express = require("express");
const router = express.Router();
const { client } = require("../config/db");
const { ObjectId } = require("mongodb");

// Collection for Terms Of Service
const TermsOfServiceCollection = client.db("Seven-Gym").collection("Terms_Of_Service");

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

module.exports = router;