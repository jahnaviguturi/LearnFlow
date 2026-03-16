const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/:courseId', authenticate, async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  try {
    const [progress] = await pool.execute(`
      SELECT p.*, l.title as lesson_title, l.youtube_video_id, s.title as section_title
      FROM progress p
      JOIN lessons l ON p.lesson_id = l.id
      JOIN sections s ON l.section_id = s.id
      WHERE p.user_id = ? AND p.course_id = ?
      ORDER BY p.last_watched DESC
    `, [userId, courseId]);

    const [[stats]] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM lessons WHERE section_id IN (SELECT id FROM sections WHERE course_id = ?)) as total_lessons,
        (SELECT COUNT(*) FROM progress WHERE user_id = ? AND course_id = ? AND completed = 1) as completed_lessons
    `, [courseId, userId, courseId]);

    const progressPercent = stats.total_lessons > 0 
      ? Math.round((stats.completed_lessons / stats.total_lessons) * 100) 
      : 0;

    res.json({
      progress,
      stats: {
        ...stats,
        progress_percent: progressPercent
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

router.post('/complete', authenticate, async (req, res) => {
  const { courseId, lessonId } = req.body;
  const userId = req.user.id;

  if (!courseId || !lessonId) {
    return res.status(400).json({ message: 'courseId and lessonId are required' });
  }

  try {
    const [lessons] = await pool.execute('SELECT * FROM lessons WHERE id = ?', [lessonId]);
    
    if (lessons.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    await pool.execute(`
      INSERT INTO progress (user_id, lesson_id, course_id, completed, last_watched)
      VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE completed = 1, last_watched = CURRENT_TIMESTAMP
    `, [userId, lessonId, courseId]);

    // Log activity
    await pool.execute(`
      INSERT INTO user_activity (user_id, activity_type, course_id, lesson_id, activity_date)
      VALUES (?, 'lesson_complete', ?, ?, CURDATE())
    `, [userId, courseId, lessonId]);

    const [[stats]] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM lessons WHERE section_id IN (SELECT id FROM sections WHERE course_id = ?)) as total_lessons,
        (SELECT COUNT(*) FROM progress WHERE user_id = ? AND course_id = ? AND completed = 1) as completed_lessons
    `, [courseId, userId, courseId]);

    const progressPercent = stats.total_lessons > 0 
      ? Math.round((stats.completed_lessons / stats.total_lessons) * 100) 
      : 0;

    // Check if course is completed (100%)
    let certificate = null;
    if (progressPercent === 100 && stats.total_lessons > 0) {
      // Check if certificate already exists
      const [existingCert] = await pool.execute(
        'SELECT * FROM certificates WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
      );
      
      if (existingCert.length === 0) {
        // Generate new certificate
        const certificateId = `LF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await pool.execute(
          'INSERT INTO certificates (user_id, course_id, certificate_id) VALUES (?, ?, ?)',
          [userId, courseId, certificateId]
        );
        
        const [newCert] = await pool.execute(
          'SELECT * FROM certificates WHERE certificate_id = ?',
          [certificateId]
        );
        certificate = newCert[0];

        // Log course completion activity
        await pool.execute(`
          INSERT INTO user_activity (user_id, activity_type, course_id, activity_date)
          VALUES (?, 'course_complete', ?, CURDATE())
        `, [userId, courseId]);

        // Award badges
        await awardBadges(userId, courseId);
      } else {
        certificate = existingCert[0];
      }
    }

    // Helper function to award badges
    async function awardBadges(userId, courseId) {
      // First course badge
      const [certs] = await pool.execute(
        'SELECT COUNT(*) as count FROM certificates WHERE user_id = ?',
        [userId]
      );
      
      if (certs[0].count === 1) {
        await pool.execute(`
          INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
          VALUES (?, 'First Course Completed', 'Award', '#22c55e')
          ON DUPLICATE KEY UPDATE earned_date = earned_date
        `, [userId]);
      }

      // 5 courses badge
      if (certs[0].count === 5) {
        await pool.execute(`
          INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
          VALUES (?, 'Course Master', 'Trophy', '#f59e0b')
          ON DUPLICATE KEY UPDATE earned_date = earned_date
        `, [userId]);
      }

      // 10 courses badge
      if (certs[0].count === 10) {
        await pool.execute(`
          INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
          VALUES (?, 'Learning Legend', 'Star', '#8b5cf6')
          ON DUPLICATE KEY UPDATE earned_date = earned_date
        `, [userId]);
      }
    }

    res.json({
      message: 'Progress updated',
      progress: {
        lessonId,
        completed: true,
        ...stats,
        progress_percent: progressPercent
      },
      courseCompleted: progressPercent === 100 && stats.total_lessons > 0,
      certificate
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

router.get('/resume/:courseId', authenticate, async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  try {
    const [inProgressLessons] = await pool.execute(`
      SELECT l.*, s.title as section_title, s.order_number as section_order
      FROM progress p
      JOIN lessons l ON p.lesson_id = l.id
      JOIN sections s ON l.section_id = s.id
      WHERE p.user_id = ? AND p.course_id = ? AND p.completed = 0
      ORDER BY p.last_watched DESC
      LIMIT 1
    `, [userId, courseId]);

    if (inProgressLessons.length > 0) {
      return res.json({ lesson: inProgressLessons[0] });
    }

    const [nextLessons] = await pool.execute(`
      SELECT l.*, s.title as section_title, s.order_number as section_order
      FROM lessons l
      JOIN sections s ON l.section_id = s.id
      WHERE s.course_id = ? 
      AND l.id NOT IN (SELECT lesson_id FROM progress WHERE user_id = ? AND completed = 1)
      ORDER BY s.order_number, l.order_number
      LIMIT 1
    `, [courseId, userId]);

    if (nextLessons.length > 0) {
      return res.json({ lesson: nextLessons[0] });
    }

    const [lastLessons] = await pool.execute(`
      SELECT l.*, s.title as section_title, s.order_number as section_order
      FROM lessons l
      JOIN sections s ON l.section_id = s.id
      WHERE s.course_id = ?
      ORDER BY s.order_number DESC, l.order_number DESC
      LIMIT 1
    `, [courseId]);

    if (lastLessons.length > 0) {
      return res.json({ lesson: lastLessons[0], completed: true });
    }

    res.json({ lesson: null });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

module.exports = router;
