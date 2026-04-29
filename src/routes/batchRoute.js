// src/routes/batchRoute.js
const express = require("express");
const router = express.Router();
const batchController = require("../controllers/batchController.js");

router.post("/", batchController.createBatch);
router.get("/:branch_id", batchController.getBatchesByBranch);
router.put("/:id", batchController.updateBatch);
router.delete("/:id", batchController.deleteBatch);
module.exports = router;
