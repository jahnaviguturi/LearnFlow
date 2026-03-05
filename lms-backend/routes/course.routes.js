const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', async (req, res) => {
  const { category, search } = req.query;
  let query = `
    SELECT c.*, u.name as instructor_name,
    (SELECT COUNT(*) FROM sections WHERE course_id = c.id) as section_count,
    (SELECT COUNT(*) FROM lessons WHERE section_id IN (SELECT id FROM sections WHERE course_id = c.id)) as lesson_count
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    query += ' AND c.category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY c.created_at DESC';

  try {
    const [courses] = await pool.execute(query, params);
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [courses] = await pool.execute(`
      SELECT c.*, u.name as instructor_name,
      (SELECT COUNT(*) FROM sections WHERE course_id = c.id) as section_count,
      (SELECT COUNT(*) FROM lessons WHERE section_id IN (SELECT id FROM sections WHERE course_id = c.id)) as lesson_count,
      (SELECT SUM(duration) FROM lessons WHERE section_id IN (SELECT id FROM sections WHERE course_id = c.id)) as total_duration
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      WHERE c.id = ?
    `, [id]);

    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const course = courses[0];

    const [sections] = await pool.execute(
      'SELECT * FROM sections WHERE course_id = ? ORDER BY order_number',
      [id]
    );

    for (const section of sections) {
      const [lessons] = await pool.execute(
        'SELECT id, title, order_number, youtube_video_id, duration FROM lessons WHERE section_id = ? ORDER BY order_number',
        [section.id]
      );
      section.lessons = lessons;
    }

    course.sections = sections;
    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

router.post('/', 
  authenticate, 
  authorize('instructor', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('thumbnail').optional().trim(),
    body('category').optional().trim(),
    body('sections').optional().isArray()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, thumbnail, category, sections = [] } = req.body;
    const instructor_id = req.user.id;

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const [courseResult] = await connection.execute(
        'INSERT INTO courses (title, description, thumbnail, category, instructor_id) VALUES (?, ?, ?, ?, ?)',
        [title, description, thumbnail, category, instructor_id]
      );

      const courseId = courseResult.insertId;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const [sectionResult] = await connection.execute(
          'INSERT INTO sections (course_id, title, order_number) VALUES (?, ?, ?)',
          [courseId, section.title, i]
        );

        const sectionId = sectionResult.insertId;
        const lessons = section.lessons || [];

        for (let j = 0; j < lessons.length; j++) {
          const lesson = lessons[j];
          await connection.execute(
            'INSERT INTO lessons (section_id, title, order_number, youtube_video_id, duration) VALUES (?, ?, ?, ?, ?)',
            [sectionId, lesson.title, j, lesson.youtube_video_id, lesson.duration || 0]
          );
        }
      }

      await connection.commit();
      res.status(201).json({ message: 'Course created successfully', courseId });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ message: 'Database error', error: error.message });
    } finally {
      connection.release();
    }
  }
);

router.put('/:id', 
  authenticate, 
  authorize('instructor', 'admin'),
  async (req, res) => {
    const { id } = req.params;
    const { title, description, thumbnail, category } = req.body;

    try {
      const [courses] = await pool.execute('SELECT * FROM courses WHERE id = ?', [id]);
      
      if (courses.length === 0) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      if (courses[0].instructor_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this course' });
      }

      await pool.execute(
        'UPDATE courses SET title = ?, description = ?, thumbnail = ?, category = ? WHERE id = ?',
        [title, description, thumbnail, category, id]
      );

      res.json({ message: 'Course updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Database error', error: error.message });
    }
  }
);

router.delete('/:id', 
  authenticate, 
  authorize('instructor', 'admin'),
  async (req, res) => {
    const { id } = req.params;

    try {
      const [courses] = await pool.execute('SELECT * FROM courses WHERE id = ?', [id]);
      
      if (courses.length === 0) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      if (courses[0].instructor_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this course' });
      }

      await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Database error', error: error.message });
    }
  }
);

module.exports = router;
