const db = require("../config/db");

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS teacher_student_assessments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      student_id INT NOT NULL,
      subject VARCHAR(120) NOT NULL,
      marks DECIMAL(10,2) NOT NULL DEFAULT 0,
      examination VARCHAR(150) NOT NULL,
      exam_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_admin_student (admin_id, student_id),
      INDEX idx_exam_date (exam_date)
    )
  `);
}

exports.getLatestAll = async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await db.query(
      `
      SELECT a.student_id, a.subject, a.marks, a.examination, a.exam_date
      FROM teacher_student_assessments a
      INNER JOIN (
        SELECT student_id, MAX(CONCAT(exam_date, '|', LPAD(id, 10, '0'))) AS latest_key
        FROM teacher_student_assessments
        WHERE admin_id = ?
        GROUP BY student_id
      ) latest
      ON latest.student_id = a.student_id
      AND CONCAT(a.exam_date, '|', LPAD(a.id, 10, '0')) = latest.latest_key
      WHERE a.admin_id = ?
      `,
      [req.admin.id, req.admin.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getByStudent = async (req, res) => {
  try {
    await ensureTable();
    const studentId = Number(req.params.studentId);
    if (!studentId) {
      return res.status(400).json({ success: false, message: "Valid student id is required" });
    }

    const [rows] = await db.query(
      `
      SELECT id, student_id, subject, marks, examination, exam_date, created_at, updated_at
      FROM teacher_student_assessments
      WHERE admin_id = ? AND student_id = ?
      ORDER BY exam_date DESC, id DESC
      `,
      [req.admin.id, studentId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createByStudent = async (req, res) => {
  try {
    await ensureTable();
    const studentId = Number(req.params.studentId);
    const { subject, marks, examination, exam_date } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "Valid student id is required" });
    }
    if (!subject || !examination || !exam_date) {
      return res.status(400).json({ success: false, message: "Subject, examination and date are required" });
    }
    const marksNum = Number(marks);
    if (Number.isNaN(marksNum) || marksNum < 0) {
      return res.status(400).json({ success: false, message: "Marks must be a valid non-negative number" });
    }

    const [studentRows] = await db.query(
      "SELECT id FROM students WHERE id = ?",
      [studentId]
    );
    if (!studentRows.length) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

  /*  const [existing] = await db.query(
      `
      SELECT id
      FROM teacher_student_assessments
      WHERE admin_id = ? AND student_id = ?
      ORDER BY exam_date DESC, id DESC
      LIMIT 1
      `,
      [req.admin.id, studentId]
    );

    if (existing.length) {
      await db.query(
        `
        UPDATE teacher_student_assessments
        SET subject = ?, marks = ?, examination = ?, exam_date = ?
        WHERE id = ? AND admin_id = ?
        `,
        [String(subject).trim(), marksNum, String(examination).trim(), exam_date, existing[0].id, req.admin.id]
      );
      return res.json({ success: true, message: "Assessment updated" });
    }   */

    await db.query(
      `
      INSERT INTO teacher_student_assessments
      (admin_id, student_id, subject, marks, examination, exam_date)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [req.admin.id, studentId, String(subject).trim(), marksNum, String(examination).trim(), exam_date]
    );
    res.status(201).json({ success: true, message: "Assessment added" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
