const express = require("express");
const router = express.Router();
const controller = require("../controllers/teacherAssignmentController.js");

router.post("/", controller.assignTeacher);
router.get("/", controller.getAllAssignments);
router.put("/:id", controller.updateAssignment);
router.delete("/:id", controller.deleteAssignment);
// router.get("/filter", controller.getAssignmentsFiltered);

module.exports = router;
