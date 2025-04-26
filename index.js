const express = require("express");
const cors = require("cors");

// Connect Database
const { connectDB } = require("./config/db");

// API callas
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
const TrainerBookingHistory = require("./routes/TrainerData/TrainerBookingHistory");
const TrainerBookingRequest = require("./routes/TrainerData/TrainerBookingRequest");
const TrainerStudentHistory = require("./routes/TrainerData/TrainerStudentHistory");
const TrainerBookingAccepted = require("./routes/TrainerData/TrainerBookingAccepted");

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
const CleanupTrainerSessions = require("./routes/Automatic/cleanupTrainerSessions");
const CleanupExpiredTrainerBookings = require("./routes/Automatic/CleanupExpiredTrainerBookings");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middle Ware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.0.11:5173"],
    credentials: true,
  })
);

app.use(express.json());

// Connect to the database
connectDB();

// Use routes
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
app.use("/Home_Services_Section", HomeServices);
app.use("/Our_Classes_Schedule", OurClassesSchedule);
app.use("/Class_Booking_Request", ClassBookingRequest);

// Trainer Data
app.use("/Trainers", Trainers);
app.use("/Trainers_Schedule", TrainersSchedule);
app.use("/Trainer_Booking_History", TrainerBookingHistory);
app.use("/Trainer_Booking_Request", TrainerBookingRequest);
app.use("/Trainer_Student_History", TrainerStudentHistory);
app.use("/Trainer_Booking_Accepted", TrainerBookingAccepted);

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
app.use("/CheckExpiredTiers", CheckExpiredTiers);
app.use("/DeleteOldWorkouts", DeleteOldWorkouts);
app.use("/BookingSessionExpire", BookingSessionExpire);
app.use("/CleanupTrainerSessions", CleanupTrainerSessions);
app.use("/CleanupExpiredTrainerBookings", CleanupExpiredTrainerBookings);

// Set up the basic route
app.get("/", (req, res) => {
  res.send("Seven Gym is Running");
});

// Listen on the specified port
app.listen(port, () => {
  console.log(`Seven Gym is Running on Port: ${port}`);
});

process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
