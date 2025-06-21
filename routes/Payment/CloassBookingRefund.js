const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection reference
const Class_Booking_RefundCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Refund");

  
module.exports = router;
