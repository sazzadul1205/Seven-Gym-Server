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
const Trainers = require("./routes/Trainers");
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
const TrainersSchedule = require("./routes/TrainersSchedule");
const OurClassesSchedule = require("./routes/OurClassesSchedule");
const ClassBookingRequest = require("./routes/ClassBookingRequest");
const TrainersBookingRequest = require("./routes/TrainersBookingRequest");

// User Schedule
const UserSchedule = require("./routes/UserSchedule/UserSchedule");

// Payment Data
const TierUpgradePayment = require("./routes/Payment/TierUpgradePayment");
const TierUpgradeRefund = require("./routes/Payment/TierUpgradeRefund");

// Payment Intent
const StripePaymentIntent = require("./routes/Payment/StripePaymentIntent");
const StripeRefundIntent = require("./routes/Payment/StripeRefundIntent");

// Automatic
const CheckExpiredTiers = require("./routes/Automatic/CheckExpiredTiers");
const DeleteOldWorkouts = require("./routes/Automatic/DeleteOldWorkouts");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middle Ware
app.use(
  cors({
    origin: ["http://localhost:5173"],
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
app.use("/Trainers", Trainers);
app.use("/Feedback", Feedback);
app.use("/TierData", TierData);
app.use("/Promotions", Promotions);
app.use("/Our_Classes", OurClasses); // Old
app.use("/Gym_Features", GymFeatures);
app.use("/Our_Missions", OurMissions);
app.use("/Testimonials", Testimonials);
app.use("/Class_Details", ClassDetails);
app.use("/Home_Banner_Section", HomeBanner);
app.use("/Home_Welcome_Section", HomeWelcome);
app.use("/Home_Services_Section", HomeServices);
app.use("/Home_Services_Section", HomeServices);
app.use("/Trainers_Schedule", TrainersSchedule);
app.use("/Our_Classes_Schedule", OurClassesSchedule); // NEW
app.use("/Class_Booking_Request", ClassBookingRequest);
app.use("/Trainers_Booking_Request", TrainersBookingRequest);

// User Schedule
app.use("/User_Schedule", UserSchedule);

// Payment Data
app.use("/Tier_Upgrade_Payment", TierUpgradePayment);
app.use("/Tier_Upgrade_Refund", TierUpgradeRefund);

// Payment Intent
app.use("/Stripe_Payment_Intent", StripePaymentIntent);
app.use("/Stripe_Refund_Intent", StripeRefundIntent);

// Automatic
app.use("/CheckExpiredTiers", CheckExpiredTiers);
app.use("/DeleteOldWorkouts", DeleteOldWorkouts);

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
