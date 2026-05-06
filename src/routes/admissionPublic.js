/**
 * PUBLIC admission endpoint — no JWT required.
 * Saves directly to the students table.
 *
 * Add to server.js BEFORE the protected students route:
 *   app.use("/api/admissions/public", require("./routes/admissionPublic"));
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ Helper: Format date to MySQL format (handles both DD-MM-YYYY and YYYY-MM-DD)
const formatDate = (date) => {
  if (!date) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const parts = date.split("-");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }

  return null;
};

router.post("/", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      father_name,
      father_phone,
      board,
      standard,
      course,
      branch,
      dob,
      address,
      aadhar,
      caste_religion,
      photo,
      admission_type,
      admission_date,
      school_fees,           // ✅ NEW
      academy_fees,          // ✅ NEW
      hostel_fees,           // ✅ NEW
    } = req.body;

    // ✅ Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required"
      });
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // ✅ Fee validation — must be non-negative numbers if provided
    const parsedSchoolFees  = school_fees  ? parseFloat(school_fees)  : 0;
    const parsedAcademyFees = academy_fees ? parseFloat(academy_fees) : 0;
    const parsedHostelFees  = hostel_fees  ? parseFloat(hostel_fees)  : 0;

    if (isNaN(parsedSchoolFees) || parsedSchoolFees < 0) {
      return res.status(400).json({ success: false, message: "Invalid School/College fee amount" });
    }
    if (isNaN(parsedAcademyFees) || parsedAcademyFees < 0) {
      return res.status(400).json({ success: false, message: "Invalid Academy fee amount" });
    }
    if (isNaN(parsedHostelFees) || parsedHostelFees < 0) {
      return res.status(400).json({ success: false, message: "Invalid Hostel fee amount" });
    }

    // ✅ Get admin
    const [admins] = await db.query("SELECT id FROM admins LIMIT 1");

    if (!admins.length) {
      return res.status(500).json({
        success: false,
        message: "No admin account configured"
      });
    }

    const adminId = admins[0]?.id || 8;

    // ✅ Photo safety check
    const safePhoto = photo || null;

    if (safePhoto && Buffer.byteLength(safePhoto, "utf8") > 2 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Photo is too large. Max size is 2MB."
      });
    }

    // ✅ Format dates
    const formattedDob           = formatDate(dob);
    const formattedAdmissionDate = formatDate(admission_date);

    // ✅ Insert query
    const [result] = await db.query(
      `INSERT INTO students
      (admin_id, name, phone, email, father_name, father_phone, standard, course, branch, dob, address, aadhar, caste_religion, photo, admission_type, admission_date, fee, paid_fee, school_fees, academy_fees, hostel_fees)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,

      [
        adminId,
        name,
        phone,
        email || "",
        father_name || "",
        father_phone || "",
        standard || "",
        course || "",
        branch || "",
        formattedDob,
        address || "",
        aadhar || "",
        caste_religion || "",
        safePhoto,
        admission_type || "",
        formattedAdmissionDate,
        parsedSchoolFees,              // ✅ NEW
        parsedAcademyFees,             // ✅ NEW
        parsedHostelFees,              // ✅ NEW
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Admission submitted successfully",
      id: result.insertId
    });

  } catch (err) {
    console.error("Public admission error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;