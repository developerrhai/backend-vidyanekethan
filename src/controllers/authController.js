const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

/* ── POST /api/auth/signup ──────────────────────────────── */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: "All fields are required" });
    const tableName = role === "admin" ? "admins" : "teachers";
    const [rows] = await db.query(`SELECT id FROM ${tableName} WHERE email = ?`, [email]);
    if (rows.length)
      return res.status(409).json({ success: false, message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO ${tableName} (name, email, password, role) VALUES (?, ?, ?, ?)`,
      [name, email, hash, role]
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please log in.",
      adminId: result.insertId,
    });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    let user = null;
    let role = null;

    // 1. Check Admins Table
    const [adminRows] = await db.query("SELECT * FROM admins WHERE email = ?", [email]);
    
    if (adminRows.length > 0) {
      user = adminRows[0];
      role = "admin";
    } else {
      // 2. If not found in admins, check Teachers Table
      const [teacherRows] = await db.query("SELECT * FROM teachers WHERE email = ?", [email]);
      if (teacherRows.length > 0) {
        user = teacherRows[0];
        role = "teacher";
      }
    }

    // 3. If user doesn't exist in either table
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // 4. Verify Password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // 5. Generate Token (Include role in payload)
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: role 
      },
      "change_this_to_a_long_random_string", // Use process.env.JWT_SECRET in production
      { expiresIn: "7d" }
    );

    // 6. Return user data (excluding password)
    const { password: _pw, ...userData } = user;
    
    return res.json({ 
      success: true, 
      message: `Login successful as ${role}`, 
      token, 
      user: { ...userData, role } 
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};
