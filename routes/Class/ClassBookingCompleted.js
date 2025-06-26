const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");

// Collection for Class Booking Completed
const Class_Booking_CompletedCollection = client
  .db("Seven-Gym")
  .collection("Class_Booking_Completed");

// GET : Get all Class Booking Completed (optionally filtered by applicant email)
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    const query = email ? { "applicant.applicantData.email": email } : {};

    const result = await Class_Booking_CompletedCollection.find(
      query
    ).toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching Class Booking Completed Data:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET: Daily class booking completion summary by endDate
router.get("/DailyStatus", async (req, res) => {
  try {
    const data = await Class_Booking_CompletedCollection.find({}).toArray();

    const dailyStatsMap = {};

    data.forEach((item) => {
      const endDate = item.endDate;
      const price = item.applicant?.totalPrice || 0;

      // Convert "DD-MM-YYYY" → "YYYY-MM-DD"
      const [dd, mm, yyyy] = endDate.split("-");
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      if (!dailyStatsMap[formattedDate]) {
        dailyStatsMap[formattedDate] = {
          date: formattedDate,
          count: 1,
          totalPrice: price,
        };
      } else {
        dailyStatsMap[formattedDate].count += 1;
        dailyStatsMap[formattedDate].totalPrice += price;
      }
    });

    // Convert to array and sort by date ascending
    const dailyStatsArray = Object.values(dailyStatsMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.status(200).json(dailyStatsArray);
  } catch (error) {
    console.error("Error generating daily class booking summary:", error);
    res.status(500).send("Something went wrong.");
  }
});

// POST : post Completed to create a new booking Completed
router.post("/", async (req, res) => {
  try {
    const newRequest = req.body;

    if (!newRequest) {
      return res.status(400).send("Invalid Completed data.");
    }

    const result = await Class_Booking_CompletedCollection.insertOne(
      newRequest
    );

    // Check if the insertedId exists
    if (result.insertedId) {
      res.status(201).send({
        message: "Booking Completed created successfully.",
        requestId: result.insertedId,
      });
    } else {
      res.status(500).send("Error creating booking Completed.");
    }
  } catch (error) {
    console.error("Error creating Class Booking Completed:", error);
    res.status(500).send("Something went wrong.");
  }
});

// DELETE: Delete all Class Booking Completed entries
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Class_Booking_CompletedCollection.deleteMany({});
    res.send({
      message: "All completed class bookings deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting Class Booking Completed data:", error);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;
