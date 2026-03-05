const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/:courseId', authenticate, async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  try {
    const [courses] = await pool.execute('SELECT * FROM courses WHERE id = ?', [courseId]);
    
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const [result] = await pool.execute(
      'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)',
      [userId, courseId]
    );

    res.status(201).json({ 
      message: 'Enrolled successfully',
      enrollmentId: result.insertId 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Already enrolled in this course' });
    }
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

router.get('/my-courses', authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const [courses] = await pool.execute(`
      SELECT 
        c.*,
        u.name as instructor_name,
        e.enrollment_date,
        (SELECT COUNT(*) FROM lessons WHERE section_id IN (SELECT id FROM sections WHERE course_id = c.id)) as total_lessons,
        (SELECT COUNT(*) FROM progress WHERE user_id = ? AND course_id = c.id AND completed = 1) as completed_lessons
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.instructor_id = u.id
      WHERE e.user_id = ?
      ORDER BY e.enrollment_date DESC
    `, [userId, userId]);

    const coursesWithProgress = courses.map(course => ({
      ...course,
      progress_percent: course.total_lessons > 0 
        ? Math.round((course.completed_lessons / course.total_lessons) * 100) 
        : 0
    }));

    res.json({ courses: coursesWithProgress });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

router.get('/check/:courseId', authenticate, async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  try {
    const [enrollments] = await pool.execute(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    res.json({ enrolled: enrollments.length > 0 });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

module.exports = router;
