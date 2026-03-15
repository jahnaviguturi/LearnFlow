const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');

// Get user's certificates
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [certificates] = await pool.execute(`
      SELECT 
        c.*,
        co.title as course_title,
        co.thumbnail,
        u.name as instructor_name,
        cert.completion_date
      FROM certificates cert
      JOIN courses co ON cert.course_id = co.id
      JOIN users u ON co.instructor_id = u.id
      WHERE cert.user_id = ?
      ORDER BY cert.completion_date DESC
    `, [userId]);
    
    res.json({ certificates });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Check if user has certificate for a course
router.get('/check/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    const [certificates] = await pool.execute(
      'SELECT * FROM certificates WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    res.json({ 
      hasCertificate: certificates.length > 0,
      certificate: certificates[0] || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Generate certificate (called when course is completed)
router.post('/generate/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    // Check if already has certificate
    const [existing] = await pool.execute(
      'SELECT * FROM certificates WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    if (existing.length > 0) {
      return res.json({ 
        message: 'Certificate already exists',
        certificate: existing[0]
      });
    }
    
    // Generate unique certificate ID
    const certificateId = `LF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const [result] = await pool.execute(
      'INSERT INTO certificates (user_id, course_id, certificate_id) VALUES (?, ?, ?)',
      [userId, courseId, certificateId]
    );
    
    const [certificate] = await pool.execute(
      'SELECT * FROM certificates WHERE id = ?',
      [result.insertId]
    );
    
    res.json({
      message: 'Certificate generated successfully',
      certificate: certificate[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

module.exports = router;
