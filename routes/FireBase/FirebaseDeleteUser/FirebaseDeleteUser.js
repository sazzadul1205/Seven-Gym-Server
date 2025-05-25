const express = require("express");
const router = express.Router();
const admin = require("../firebaseAdmin");

router.post("/AdminDeleteUser", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(userRecord.uid);
    return res.json({ success: true, message: `Deleted user: ${email}` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
