// index.js
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// Connect Database
const { connectDB } = require("./config/db");

// API routes
const Users = require("./routes/Users");
const Forums = require("./routes/Forums");
const AboutUs = require("./routes/AboutUs");
const Gallery = require("./routes/Gallery");
const TierData = require("./routes/TierData");
const Feedback = require("./routes/Feedback");
const OurClasses = require("./routes/OurClasses");
const HomeBanner = require("./routes/HomeBanner");
const Promotions = require("./routes/Promotions");
const HomeWelcome = require("./routes/HomeWelcome");
const OurMissions = require("./routes/OurMissions");
const GymFeatures = require("./routes/GymFeatures");
const HomeServices = require("./routes/HomeServices");
const ClassDetails = require("./routes/ClassDetails");
const Testimonials = require("./routes/Testimonials");
const OurClassesSchedule = require("./routes/OurClassesSchedule");
const ClassBookingRequest = require("./routes/ClassBookingRequest");

// Trainer Data
const Trainers = require("./routes/TrainerData/Trainers");
const TrainersSchedule = require("./routes/TrainerData/TrainersSchedule");
const TrainerAnnouncement = require("./routes/TrainerData/TrainerAnnouncement");
const TrainerBookingHistory = require("./routes/TrainerData/TrainerBookingHistory");
const TrainerBookingRequest = require("./routes/TrainerData/TrainerBookingRequest");
const TrainerStudentHistory = require("./routes/TrainerData/TrainerStudentHistory");
const TrainerBookingAccepted = require("./routes/TrainerData/TrainerBookingAccepted");
const TrainerClassInformation = require("./routes/TrainerData/TrainerClassInformation");

// User Schedule
const UserSchedule = require("./routes/UserSchedule/UserSchedule");

// Payment Data
const TierUpgradeRefund = require("./routes/Payment/TierUpgradeRefund");
const TierUpgradePayment = require("./routes/Payment/TierUpgradePayment");
const TrainerSessionPayment = require("./routes/Payment/TrainerSessionPayment");
const TrainerSessionRefund = require("./routes/Payment/TrainerSessionRefund");

// Payment Intent
const StripeRefundIntent = require("./routes/Payment/StripeRefundIntent");
const StripePaymentIntent = require("./routes/Payment/StripePaymentIntent");

// Automatic
const CheckExpiredTiers = require("./routes/Automatic/CheckExpiredTiers");
const DeleteOldWorkouts = require("./routes/Automatic/DeleteOldWorkouts");
const BookingSessionExpire = require("./routes/Automatic/BookingSessionExpire");
const CleanupTrainerSessions = require("./routes/Automatic/CleanupTrainerSessions");
const CleanupExpiredTrainerBookings = require("./routes/Automatic/CleanupExpiredTrainerBookings");
const AutoUnBan = require("./routes/Automatic/AutoUnBan");

// Admin Firebase Delete User
const AdminDeleteUser = require("./routes/FireBase/FirebaseDeleteUser/FirebaseDeleteUser");

require("dotenv").config();
const app = express();

// CORS – add your prod domains here
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-app.vercel.app",
      "https://www.your-custom-domain.com",
    ],
    credentials: true,
  })
);

app.use(express.json());

// Connect to the database
connectDB();

// Auth endpoint: issues JWT
app.post("/jwt", async (req, res) => {
  try {
    const { user } = req.body;
    if (!user || typeof user !== "object") {
      return res.status(400).json({ message: "Missing user object." });
    }
    const { id, email, role = "user" } = user;
    if (!id || !email) {
      return res.status(400).json({ message: "Invalid user data." });
    }
    const payload = { id, email, role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "10d",
      issuer: "www.Seven-Gym-Auth.com",
    });
    res.status(200).json({ token });
  } catch (error) {
    console.error("JWT generation error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Mount routes
app.use("/Users", Users);
app.use("/Forums", Forums);
app.use("/AboutUs", AboutUs);
app.use("/Gallery", Gallery);
app.use("/Feedback", Feedback);
app.use("/TierData", TierData);
app.use("/Promotions", Promotions);
app.use("/Our_Classes", OurClasses);
app.use("/Gym_Features", GymFeatures);
app.use("/Our_Missions", OurMissions);
app.use("/Testimonials", Testimonials);
app.use("/Class_Details", ClassDetails);
app.use("/Home_Banner_Section", HomeBanner);
app.use("/Home_Welcome_Section", HomeWelcome);
app.use("/Home_Services_Section", HomeServices);
app.use("/Our_Classes_Schedule", OurClassesSchedule);
app.use("/Class_Booking_Request", ClassBookingRequest);

// Trainer Data
app.use("/Trainers", Trainers);
app.use("/Trainers_Schedule", TrainersSchedule);
app.use("/Trainer_Announcement", TrainerAnnouncement);
app.use("/Trainer_Booking_History", TrainerBookingHistory);
app.use("/Trainer_Booking_Request", TrainerBookingRequest);
app.use("/Trainer_Student_History", TrainerStudentHistory);
app.use("/Trainer_Booking_Accepted", TrainerBookingAccepted);
app.use("/Trainer_Class_Information", TrainerClassInformation);

// User Schedule
app.use("/User_Schedule", UserSchedule);

// Payment Data
app.use("/Tier_Upgrade_Refund", TierUpgradeRefund);
app.use("/Tier_Upgrade_Payment", TierUpgradePayment);
app.use("/Trainer_Session_Refund", TrainerSessionRefund);
app.use("/Trainer_Session_Payment", TrainerSessionPayment);

// Payment Intent
app.use("/Stripe_Refund_Intent", StripeRefundIntent);
app.use("/Stripe_Payment_Intent", StripePaymentIntent);

// Automatic
app.use("/AutoUnBan", AutoUnBan);
app.use("/CheckExpiredTiers", CheckExpiredTiers);
app.use("/DeleteOldWorkouts", DeleteOldWorkouts);
app.use("/BookingSessionExpire", BookingSessionExpire);
app.use("/CleanupTrainerSessions", CleanupTrainerSessions);
app.use("/CleanupExpiredTrainerBookings", CleanupExpiredTrainerBookings);
app.use("/CleanupExpiredTrainerBookings", CleanupExpiredTrainerBookings);

// Admin Firebase Delete User
app.use("/AdminAdminDeleteUser", AdminDeleteUser);

// Root health-check
app.get("/", (req, res) => {
  res.send("Seven Gym is Running");
});

// Error handlers
process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Export for Vercel serverless
module.exports = app;
