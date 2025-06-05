const express = require("express");
const router = express.Router();
const { client } = require("../../config/db");
const { ObjectId } = require("mongodb");

// Collection for Trainer_Booking_History
const Trainer_Booking_HistoryCollection = client
  .db("Seven-Gym")
  .collection("Trainer_Booking_History");

// Get Trainer_Booking_History
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    const query = email ? { bookerEmail: email } : {};

    const result = await Trainer_Booking_HistoryCollection.find(
      query
    ).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching Trainer_Booking_History:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get trainer report
router.get("/DailyStats", async (req, res) => {
  try {
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).send("Trainer ID is required.");
    }

    const data = await Trainer_Booking_HistoryCollection.find({
      trainerId,
    }).toArray();

    const refundedData = {};
    const endedData = [];

    for (const item of data) {
      if (item.status === "Ended") {
        // Calculate end date properly
        if (item.startAt && item.durationWeeks) {
          const startDate = new Date(item.startAt);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + item.durationWeeks * 7 - 1); // -1 to make it realistic

          const day = String(endDate.getDate()).padStart(2, "0");
          const month = String(endDate.getMonth() + 1).padStart(2, "0"); // Month is zero-indexed
          const year = endDate.getFullYear();

          endedData.push({
            status: "Ended",
            "date Ended": `${day}-${month}-${year}`,
            sessions: item.sessions.length,
            totalEarned: parseFloat(item.totalPrice),
          });
        }
      } else {
        // Group by droppedAt date for refunds
        if (item.droppedAt) {
          const droppedDate = item.droppedAt.split(" ")[0].replaceAll("/", "-"); // Normalize if needed
          const [day, month, year] = droppedDate.includes("-")
            ? droppedDate.split("-")
            : droppedDate.split("/");

          const formattedDate = `${day.padStart(2, "0")}-${month.padStart(
            2,
            "0"
          )}-${year}`;

          if (!refundedData[formattedDate]) {
            refundedData[formattedDate] = {
              date: formattedDate,
              sessions: 0,
              totalRefundedAmount: 0,
            };
          }

          refundedData[formattedDate].sessions += item.sessions.length;
          refundedData[formattedDate].totalRefundedAmount += item.RefundAmount
            ? parseFloat(item.RefundAmount)
            : 0;
        }
      }
    }

    const finalResult = [...Object.values(refundedData), ...endedData];

    res.send(finalResult);
  } catch (error) {
    console.error("Error generating trainer report:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Get all booking history by trainerId
router.get("/Trainer/:trainerId", async (req, res) => {
  try {
    const { trainerId } = req.params;

    const query = {
      $or: [
        { trainerId }, // If stored as string
        { trainerId: new ObjectId(trainerId) }, // If stored as ObjectId
      ],
    };

    const result = await Trainer_Booking_HistoryCollection.find(
      query
    ).toArray();

    if (result.length === 0) {
      return res.status(404).send("No bookings found for this trainer.");
    }

    res.send(result);
  } catch (error) {
    console.error("Error fetching bookings by trainerId:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET : get all the booking that are Completed
router.get("/Completed", async (req, res) => {
  try {
    const result = await Trainer_Booking_HistoryCollection.find({
      status: "Ended",
    }).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching completed bookings:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET : Daily summary of completed bookings (based on endDate)
router.get("/Completed/DailyStatus", async (req, res) => {
  try {
    const result = await Trainer_Booking_HistoryCollection.aggregate([
      {
        $match: {
          status: "Ended",
          startAt: { $ne: null },
          durationWeeks: { $gt: 0 },
        },
      },
      {
        $addFields: {
          // Convert startAt to Date
          startDate: { $toDate: "$startAt" },
        },
      },
      {
        $addFields: {
          // Calculate endDate = startAt + (durationWeeks * 7 days)
          endDate: {
            $dateAdd: {
              startDate: "$startDate",
              unit: "day",
              amount: { $multiply: ["$durationWeeks", 7] },
            },
          },
        },
      },
      {
        $addFields: {
          // Format endDate as "dd-mm-yyyy"
          formattedEndDate: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$endDate",
            },
          },
        },
      },
      {
        $group: {
          _id: "$formattedEndDate",
          totalPrice: { $sum: { $toDouble: "$totalPrice" } },
          sessions: { $sum: { $size: "$sessions" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          endDate: "$_id",
          totalPrice: 1,
          sessions: 1,
          count: 1,
        },
      },
      {
        $sort: {
          endDate: 1,
        },
      },
    ]).toArray();

    res.send(result);
  } catch (error) {
    console.error("Error generating completed booking summary:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET: get all the booking that are Cancelled
router.get("/Cancelled", async (req, res) => {
  try {
    const result = await Trainer_Booking_HistoryCollection.find({
      status: { $ne: "Ended" },
    }).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching cancelled bookings:", error);
    res.status(500).send("Something went wrong.");
  }
});

// GET: Daily summary of cancelled bookings (based on droppedAt)
router.get("/Cancelled/DailyStatus", async (req, res) => {
  try {
    const result = await Trainer_Booking_HistoryCollection.aggregate([
      {
        $match: {
          status: { $ne: "Ended" },
          droppedAt: { $ne: null },
        },
      },
      {
        $addFields: {
          droppedDate: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: {
                $toDate: {
                  $dateFromString: {
                    dateString: "$droppedAt",
                    format: "%d-%m-%Y %H:%M:%S",
                  },
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$droppedDate",
          refundedAmount: { $sum: { $toDouble: "$RefundAmount" } },
          sessions: { $sum: { $size: "$sessions" } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          droppedDate: "$_id",
          refundedAmount: 1,
          sessions: 1,
          count: 1,
        },
      },
      {
        $sort: {
          droppedDate: 1,
        },
      },
    ]).toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching cancelled bookings summary:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Post request to create a new booking request
router.post("/", async (req, res) => {
  try {
    const newRequest = { ...req.body };

    if (!newRequest || !newRequest.status) {
      return res.status(400).send("Invalid request data. Status is required.");
    }

    // Only update loggedTime if it already exists in the request
    if ("loggedTime" in newRequest) {
      const now = new Date();
      const date = now.toLocaleDateString("en-GB").split("/").join(" "); // dd mm yyyy
      const time = now.toTimeString().split(" ")[0].slice(0, 5); // hh:mm
      newRequest.loggedTime = `${date} ${time}`;
    }

    const result = await Trainer_Booking_HistoryCollection.insertOne(
      newRequest
    );

    if (result.insertedId) {
      res.status(201).send({
        message: "Booking History request Created successfully.",
        requestId: result.insertedId,
      });
    } else {
      res.status(500).send("Error creating booking History request.");
    }
  } catch (error) {
    console.error("Error creating Trainer_Booking_History:", error);
    res.status(500).send("Something went wrong.");
  }
});

// Deleting all booking history
router.delete("/DeleteAll", async (req, res) => {
  try {
    const result = await Trainer_Booking_HistoryCollection.deleteMany({});

    res.send({
      message: "All Trainer Booking History Deleted Successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all Trainer Booking History:", error);
    res.status(500).send("Failed to delete booking history.");
  }
});

module.exports = router;
