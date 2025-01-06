const express = require("express");
const cors = require("cors");

// Connect Database
const { connectDB } = require("./config/db");

// API callas
const HomeBanner = require("./routes/HomeBanner");
const HomeWelcome = require("./routes/HomeWelcome");
const HomeServices = require("./routes/HomeServices");
const OurClasses = require("./routes/OurClasses");
const ClassDetails = require("./routes/ClassDetails");
const Trainers = require("./routes/Trainers");
const Testimonials = require("./routes/Testimonials");
const Gallery = require("./routes/Gallery");
const Promotions = require("./routes/Promotions");
const GymFeatures = require("./routes/GymFeatures");
const Forums = require("./routes/Forums");
const OurMissions = require("./routes/OurMissions");
const AboutUs = require("./routes/AboutUs");
const Feedback = require("./routes/Feedback");
const TrainersSchedule = require("./routes/TrainersSchedule");
const Users = require("./routes/Users");
const TrainersBookingRequest = require("./routes/TrainersBookingRequest");
const ClassBookingRequest = require("./routes/ClassBookingRequest");
const TierData = require("./routes/TierData");
const CreatePaymentIntent = require("./routes/CreatePaymentIntent");

// Payment
const TierUpgradePayment = require("./routes/Payment/TierUpgradePayment");

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
app.use("/Home_Banner_Section", HomeBanner);
app.use("/Home_Welcome_Section", HomeWelcome);
app.use("/Home_Services_Section", HomeServices);
app.use("/Home_Services_Section", HomeServices);
app.use("/Our_Classes", OurClasses);
app.use("/Class_Details", ClassDetails);
app.use("/Trainers", Trainers);
app.use("/Testimonials", Testimonials);
app.use("/Gallery", Gallery);
app.use("/Promotions", Promotions);
app.use("/Gym_Features", GymFeatures);
app.use("/Forums", Forums);
app.use("/Our_Missions", OurMissions);
app.use("/AboutUs", AboutUs);
app.use("/Feedback", Feedback);
app.use("/Trainers_Schedule", TrainersSchedule);
app.use("/Users", Users);
app.use("/Trainers_Booking_Request", TrainersBookingRequest);
app.use("/Class_Booking_Request", ClassBookingRequest);
app.use("/TierData", TierData);
app.use("/Create_Payment_Intent", CreatePaymentIntent);
app.use("/Tier_Upgrade_Payment", TierUpgradePayment);

// Set up the basic route
app.get("/", (req, res) => {
  res.send("Seven Gym is Running");
});

// Listen on the specified port
app.listen(port, () => {
  console.log(`Seven Gym is Running on Port: ${port}`);
});
