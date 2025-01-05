const express = require("express");
const router = express.Router();
const stripe = require("stripe")(
  "sk_test_51QdwmBFTkipGUF29NDMqKd5f2AnUO9BL6vhkOdmPlrMjFZa022ngqh5rQ0zZ3tmOgtoCsvJjc1i514Q0slD9H1el00nJ8f1WWJ"
);

// Create Payment Intent
router.post("/", async (req, res) => {
  try {
    const { totalPrice } = req.body;

    if (!totalPrice || typeof totalPrice !== "number") {
      return res.status(400).send({ error: "Invalid total price provided." });
    }

    // Create a PaymentIntent with the specified amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Amount in cents
      currency: "usd", // You can change this to your desired currency
      payment_method_types: ["card"],
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    res.status(500).send({
      error: "Failed to create PaymentIntent. Please try again later.",
    });
  }
});

module.exports = router;
