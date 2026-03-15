const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');

// Add or update review
router.post('/', authenticate, async (req, res) => {
  try {
    const { courseId, rating, review } = req.body;
    const userId = req.user.id;

    // Check if user is enrolled
    const [enrollments] = await pool.execute(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({ message: 'Must be enrolled to review' });
    }

    // Insert or update review
    await pool.execute(`
      INSERT INTO course_reviews (user_id, course_id, rating, review)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE rating = ?, review = ?, created_at = CURRENT_TIMESTAMP
    `, [userId, courseId, rating, review, rating, review]);

    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Get reviews for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const [reviews] = await pool.execute(`
      SELECT r.*, u.name as user_name
      FROM course_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.course_id = ?
      ORDER BY r.created_at DESC
    `, [courseId]);

    // Calculate average rating
    const [avgResult] = await pool.execute(
      'SELECT AVG(rating) as average, COUNT(*) as total FROM course_reviews WHERE course_id = ?',
      [courseId]
    );

    res.json({
      reviews,
      averageRating: Math.round(avgResult[0].average * 10) / 10 || 0,
      totalReviews: avgResult[0].total
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Get top rated courses
router.get('/top-rated', async (req, res) => {
  try {
    const [courses] = await pool.execute(`
      SELECT 
        c.*,
        u.name as instructor_name,
        AVG(r.rating) as average_rating,
        COUNT(r.id) as review_count
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN course_reviews r ON c.id = r.course_id
      GROUP BY c.id
      HAVING review_count > 0
      ORDER BY average_rating DESC, review_count DESC
      LIMIT 10
    `);

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Check if user has reviewed
router.get('/check/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const [reviews] = await pool.execute(
      'SELECT * FROM course_reviews WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    res.json({ 
      hasReviewed: reviews.length > 0,
      review: reviews[0] || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

module.exports = router;
