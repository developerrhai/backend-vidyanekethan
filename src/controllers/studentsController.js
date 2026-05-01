const db = require("../config/db");

/* GET /api/students?standard=&course=&branch=&search= */
exports.getAll = async (req, res) => {
  try {
    const { standard, course, branch, search } = req.query;
/*    let sql = "SELECT * FROM students WHERE admin_id = ? OR admin_id = 8";
    const params = [req.admin.id]; */

 let sql = "SELECT * FROM students WHERE 1=1";
    const params = [];

    if (standard) { sql += " AND standard = ?"; params.push(standard); }
    if (course)     { sql += " AND course LIKE ?"; params.push(`%${course}%`); }
    if (branch)  { sql += " AND branch = ?"; params.push(branch); }
    if (search) {
      sql += " AND (name LIKE ? OR phone LIKE ? OR father_phone LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    sql += " ORDER BY created_at DESC";

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/students/:id */
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      "Select * from students WHERE id = ? AND (admin_id = ? OR admin_id = 8)",
      [req.params.id, req.admin.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* POST /api/students */
exports.create = async (req, res) => {
  try {
    const { admin_id,name, email, phone, father_name, father_phone, gender, academic_year, standard, course, branch, hostel, fee, paid_fee } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });

    const [result] = await db.query(
      `INSERT INTO students
         (admin_id,name,email,phone,father_name,father_phone,gender,academic_year,standard,course,branch,hostel,fee,paid_fee)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, ?)`,
      [admin_id, name, email||null, phone||"", father_name||"", father_phone||"",
       gender||"", academic_year||"", standard||"", course||"", branch||"", hostel||"", fee||0, paid_fee||0]
    );
    res.status(201).json({ success: true, message: "Student created", id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* PUT /api/students/:id */
exports.update = async (req, res) => {
  try {
    const { admin_id,name, id, email, phone, father_name, father_phone, gender, academic_year, standard, course, branch, hostel, academy_fee, school_fee, hostel_fee, fee, paid_fee } = req.body;
    const [result] = await db.query(
      `UPDATE students
       SET name=?,email=?,phone=?,father_name=?,father_phone=?,standard=?,course=?,
       branch=?,academy_fee=?,school_fee=?,hostel_fee=?,fee=?,paid_fee=?
       WHERE id=?`,
      [name, email||null, phone||"", father_name||"", father_phone||"",
       standard||"", course||"", branch||"", academy_fee||0, school_fee||0, hostel_fee||0, fee||0, paid_fee||0,
       id]
    );

    console.log("Admin id", result);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* DELETE /api/students/:id */
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM students WHERE id = ? AND (admin_id = ? OR admin_id = 8)",
      [req.params.id, req.admin.id]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
