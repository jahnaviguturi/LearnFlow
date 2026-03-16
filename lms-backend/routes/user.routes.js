const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');

// Get user profile with stats
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user basic info
    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Get profile details
    const [profiles] = await pool.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    const profile = profiles[0] || {};

    // Get learning stats
    const [stats] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM enrollments WHERE user_id = ?) as total_enrolled,
        (SELECT COUNT(DISTINCT course_id) FROM certificates WHERE user_id = ?) as completed_courses,
        (SELECT COUNT(*) FROM certificates WHERE user_id = ?) as certificates_earned,
        (SELECT COUNT(*) FROM progress WHERE user_id = ? AND completed = 1) as lessons_completed,
        (SELECT COALESCE(SUM(duration), 0) FROM lessons l 
         JOIN progress p ON l.id = p.lesson_id 
         WHERE p.user_id = ? AND p.completed = 1) as total_learning_seconds
    `, [userId, userId, userId, userId, userId]);

    // Get in-progress courses count
    const [inProgressResult] = await pool.execute(`
      SELECT COUNT(*) as in_progress FROM (
        SELECT e.course_id
        FROM enrollments e
        LEFT JOIN certificates c ON e.course_id = c.course_id AND e.user_id = c.user_id
        WHERE e.user_id = ? AND c.id IS NULL
      ) as in_progress_courses
    `, [userId]);

    // Get badges
    const [badges] = await pool.execute(
      'SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_date DESC',
      [userId]
    );

    // Get certificates
    const [certificates] = await pool.execute(`
      SELECT c.*, co.title as course_title, co.thumbnail, u.name as instructor_name
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON co.instructor_id = u.id
      WHERE c.user_id = ?
      ORDER BY c.completion_date DESC
    `, [userId]);

    // Get learning activity (last 30 days)
    const [activity] = await pool.execute(`
      SELECT activity_date, COUNT(*) as count
      FROM user_activity
      WHERE user_id = ? AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY activity_date
      ORDER BY activity_date
    `, [userId]);

    // Calculate streak
    const [streakResult] = await pool.execute(`
      SELECT COUNT(DISTINCT activity_date) as streak_days
      FROM user_activity
      WHERE user_id = ? AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `, [userId]);

    // Get skill progress by category
    const [skills] = await pool.execute(`
      SELECT 
        c.category,
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT cert.id) as completed_courses,
        ROUND(COUNT(DISTINCT cert.id) / COUNT(DISTINCT c.id) * 100, 0) as progress_percent
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN certificates cert ON c.id = cert.course_id AND cert.user_id = e.user_id
      WHERE e.user_id = ?
      GROUP BY c.category
    `, [userId]);

    res.json({
      user: {
        ...user,
        bio: profile.bio || '',
        banner_url: profile.banner_url || '',
        theme_color: profile.theme_color || '#6366f1',
        social_links: profile.social_links ? JSON.parse(profile.social_links) : {}
      },
      stats: {
        ...stats[0],
        in_progress: inProgressResult[0].in_progress,
        total_learning_hours: Math.round(stats[0].total_learning_seconds / 3600 * 10) / 10,
        current_streak: streakResult[0].streak_days
      },
      badges,
      certificates,
      activity,
      skills
    });
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, banner_url, theme_color, social_links } = req.body;

    await pool.execute(`
      INSERT INTO user_profiles (user_id, bio, banner_url, theme_color, social_links)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        bio = VALUES(bio),
        banner_url = VALUES(banner_url),
        theme_color = VALUES(theme_color),
        social_links = VALUES(social_links)
    `, [userId, bio, banner_url, theme_color, JSON.stringify(social_links)]);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Get skill tree
router.get('/skill-tree', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all courses organized by category with progress
    const [courses] = await pool.execute(`
      SELECT 
        c.*,
        u.name as instructor_name,
        cert.id as certificate_id,
        (SELECT COUNT(*) FROM lessons WHERE section_id IN (SELECT id FROM sections WHERE course_id = c.id)) as total_lessons,
        (SELECT COUNT(*) FROM progress WHERE user_id = ? AND course_id = c.id AND completed = 1) as completed_lessons
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN certificates cert ON c.id = cert.course_id AND cert.user_id = ?
      ORDER BY c.category, c.title
    `, [userId, userId]);

    // Organize by category
    const skillTree = {};
    courses.forEach(course => {
      if (!skillTree[course.category]) {
        skillTree[course.category] = [];
      }
      
      const progressPercent = course.total_lessons > 0 
        ? Math.round((course.completed_lessons / course.total_lessons) * 100)
        : 0;

      skillTree[course.category].push({
        ...course,
        progress_percent: progressPercent,
        status: course.certificate_id ? 'completed' : (progressPercent > 0 ? 'in_progress' : 'locked')
      });
    });

    res.json({ skillTree });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Award badge to user
router.post('/award-badge', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { badge_name, badge_icon, badge_color } = req.body;

    await pool.execute(`
      INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE earned_date = earned_date
    `, [userId, badge_name, badge_icon, badge_color]);

    res.json({ message: 'Badge awarded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Log activity
router.post('/activity', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { activity_type, course_id, lesson_id } = req.body;

    await pool.execute(`
      INSERT INTO user_activity (user_id, activity_type, course_id, lesson_id, activity_date)
      VALUES (?, ?, ?, ?, CURDATE())
    `, [userId, activity_type, course_id, lesson_id]);

    // Check and award badges based on activity
    await checkAndAwardBadges(userId);

    res.json({ message: 'Activity logged' });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Helper function to check and award badges
async function checkAndAwardBadges(userId) {
  // First course completed
  const [certificates] = await pool.execute(
    'SELECT COUNT(*) as count FROM certificates WHERE user_id = ?',
    [userId]
  );
  
  if (certificates[0].count === 1) {
    await pool.execute(`
      INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
      VALUES (?, 'First Course Completed', 'Award', '#22c55e')
      ON DUPLICATE KEY UPDATE earned_date = earned_date
    `, [userId]);
  }

  // 5 courses completed
  if (certificates[0].count === 5) {
    await pool.execute(`
      INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
      VALUES (?, 'Course Master', 'Trophy', '#f59e0b')
      ON DUPLICATE KEY UPDATE earned_date = earned_date
    `, [userId]);
  }

  // Check streak
  const [streakResult] = await pool.execute(`
    SELECT COUNT(DISTINCT activity_date) as streak
    FROM user_activity
    WHERE user_id = ? AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  `, [userId]);

  if (streakResult[0].streak >= 7) {
    await pool.execute(`
      INSERT INTO user_badges (user_id, badge_name, badge_icon, badge_color)
      VALUES (?, '7 Day Streak', 'Flame', '#ef4444')
      ON DUPLICATE KEY UPDATE earned_date = earned_date
    `, [userId]);
  }
}

module.exports = router;
