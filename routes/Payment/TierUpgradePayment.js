const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Tier_Upgrade_Payment
const Tier_Upgrade_PaymentCollection = client
  .db("Seven-Gym")
  .collection("Tier_Upgrade_Payment");

// Get Tier_Upgrade_Payment with optional filters
router.get("/", async (req, res) => {
  try {
    const { _id, email, tier, duration, paymentID, stripePaymentID } =
      req.query;

    const query = {};

    if (_id) {
      try {
        query._id = new ObjectId(_id);
      } catch (err) {
        return res.status(400).send("Invalid _id format");
      }
    }
    if (email) {
      query.email = email;
    }
    if (tier) {
      query.tier = tier;
    }
    if (duration) {
      query.duration = duration;
    }
    if (paymentID) {
      query.paymentID = paymentID;
    }
    if (stripePaymentID) {
      query.stripePaymentID = stripePaymentID;
    }

    // If query is empty, fetch all
    const result = await Tier_Upgrade_PaymentCollection.find(
      Object.keys(query).length ? query : {}
    ).toArray();

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching Tier_Upgrade_Payment:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Query by paymentID, email, paymentMethod, or tier
router.get("/search", async (req, res) => {
  try {
    const { paymentID, email, paymentMethod, tier } = req.query;

    // Initialize dynamic query object
    const query = {};
    if (paymentID) query.paymentID = paymentID;
    if (email) query.email = email;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (tier) query.tier = tier;

    // Ensure at least one query parameter is provided
    if (Object.keys(query).length === 0) {
      return res.status(400).send({
        message:
          "Please provide at least one search parameter: paymentID, email, paymentMethod, or tier.",
      });
    }

    // Execute query
    const result = await Tier_Upgrade_PaymentCollection.find(query).toArray();

    if (result.length === 1) {
      return res.status(200).send(result[0]); // Single match
    } else if (result.length > 1) {
      return res.status(200).send(result); // Multiple matches
    } else {
      return res.status(404).send({
        message: "No records found matching the query.",
        query: query,
      });
    }
  } catch (error) {
    console.error("Error querying Tier_Upgrade_Payment:", error);
    return res.status(500).send("Something went wrong.");
  }
});

// GET : Daily TotalPrice and Count
router.get("/DailyStatus", async (req, res) => {
  try {
    const result = await Tier_Upgrade_PaymentCollection.aggregate([
      {
        $addFields: {
          paymentTime: {
            $cond: [
              { $eq: [{ $type: "$paymentTime" }, "string"] },
              { $toDate: "$paymentTime" },
              "$paymentTime",
            ],
          },
          totalPrice: {
            $cond: [
              {
                $in: [
                  { $type: "$totalPrice" },
                  ["string", "int", "double", "decimal"],
                ],
              },
              {
                $cond: [
                  { $eq: [{ $type: "$totalPrice" }, "string"] },
                  {
                    $convert: {
                      input: "$totalPrice",
                      to: "double",
                      onError: null,
                      onNull: null,
                    },
                  },
                  "$totalPrice",
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $match: {
          paymentTime: { $type: "date" },
          totalPrice: { $ne: null },
        },
      },
      {
        $addFields: {
          paymentDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$paymentTime" },
          },
        },
      },
      {
        $group: {
          _id: "$paymentDate",
          totalRevenue: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]).toArray();

    res.status(200).send(result);
  } catch (error) {
    console.error("Error calculating daily totals:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST Tier_Upgrade_Payment
router.post("/", async (req, res) => {
  try {
    const paymentData = req.body;

    // Insert data directly into the collection
    const result = await Tier_Upgrade_PaymentCollection.insertOne(paymentData);

    res.status(201).send({
      message: "Payment record added successfully.",
      paymentId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding Tier_Upgrade_Payment:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE : all Tier_Upgrade_Payment records (Use with caution!)
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Tier_Upgrade_PaymentCollection.deleteMany({});

    res.status(200).send({
      message: "All Tier Upgrade Payment records have been deleted.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all Tier_Upgrade_Payment records:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
