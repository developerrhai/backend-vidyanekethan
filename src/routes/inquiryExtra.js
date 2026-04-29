const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const c = require("../controllers/inquiryExtraController");

// Universal inquiry_extra data for all logged-in users.
router.get("/", auth, c.getAll);
// router.post("/", auth, c.create);

module.exports = router;
