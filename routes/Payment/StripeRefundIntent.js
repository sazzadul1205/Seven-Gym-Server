require("dotenv").config();
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Refund Payment
router.post("/", async (req, res) => {
  try {
    const { stripePaymentID, refundAmount } = req.body;

    // Validate input
    if (!stripePaymentID) {
      return res.status(400).json({ error: "Payment ID is required." });
    }

    if (
      !refundAmount ||
      typeof refundAmount !== "number" ||
      refundAmount <= 0
    ) {
      return res
        .status(400)
        .json({ error: "Valid refund amount is required." });
    }

    // Initiate refund
    const refund = await stripe.refunds.create({
      payment_intent: stripePaymentID,
      amount: Math.round(refundAmount * 100), // Convert to cents
    });

    res.status(200).json({ success: true, refund });
  } catch (error) {
    console.error("Refund Error:", error);
    res.status(500).json({ error: "Refund failed. Please try again later." });
  }
});

module.exports = router;
