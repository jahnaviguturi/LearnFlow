const { pool, initDatabase } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    await initDatabase();
    
    const hashedPassword = await bcrypt.hash('password123', 10);

    await pool.execute('DROP TABLE IF EXISTS progress');
    await pool.execute('DROP TABLE IF EXISTS enrollments');
    await pool.execute('DROP TABLE IF EXISTS lessons');
    await pool.execute('DROP TABLE IF EXISTS sections');
    await pool.execute('DROP TABLE IF EXISTS courses');
    await pool.execute('DROP TABLE IF EXISTS users');
    
    await initDatabase();

    await pool.execute(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Admin User', 'admin@lms.com', hashedPassword, 'admin']
    );

    const [instructorResult] = await pool.execute(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['John Instructor', 'instructor@lms.com', hashedPassword, 'instructor']
    );

    const instructorId = instructorResult.insertId;

    const [course1Result] = await pool.execute(
      `INSERT INTO courses (title, description, thumbnail, category, instructor_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        'Complete Web Development Bootcamp',
        'Learn HTML, CSS, JavaScript, React, Node.js and more in this comprehensive course',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
        'Development',
        instructorId
      ]
    );

    const course1Id = course1Result.insertId;

    const sections1 = [
      { title: 'HTML Fundamentals', lessons: [
        { title: 'Introduction to HTML', youtube_id: 'qz0aGYrrlhU', duration: 600 },
        { title: 'HTML Document Structure', youtube_id: 'bWPMSSsVdPk', duration: 720 },
        { title: 'Working with Forms', youtube_id: 'fNcJuPIZ2WE', duration: 540 }
      ]},
      { title: 'CSS Styling', lessons: [
        { title: 'CSS Basics and Selectors', youtube_id: '1PnVor36_40', duration: 480 },
        { title: 'Flexbox Layout', youtube_id: 'JJSoEo8JSnc', duration: 660 }
      ]}
    ];

    for (let i = 0; i < sections1.length; i++) {
      const section = sections1[i];
      const [sectionResult] = await pool.execute(
        'INSERT INTO sections (course_id, title, order_number) VALUES (?, ?, ?)',
        [course1Id, section.title, i]
      );

      const sectionId = sectionResult.insertId;

      for (let j = 0; j < section.lessons.length; j++) {
        const lesson = section.lessons[j];
        await pool.execute(
          'INSERT INTO lessons (section_id, title, order_number, youtube_video_id, duration) VALUES (?, ?, ?, ?, ?)',
          [sectionId, lesson.title, j, lesson.youtube_id, lesson.duration]
        );
      }
    }

    const [course2Result] = await pool.execute(
      `INSERT INTO courses (title, description, thumbnail, category, instructor_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        'React.js Masterclass',
        'Build modern web applications with React hooks, context, and best practices',
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
        'Development',
        instructorId
      ]
    );

    const course2Id = course2Result.insertId;

    const sections2 = [
      { title: 'React Fundamentals', lessons: [
        { title: 'What is React?', youtube_id: 'w7ejDZ8SWv8', duration: 480 },
        { title: 'Components and Props', youtube_id: 'Ke90Tje7VS0', duration: 600 }
      ]}
    ];

    for (let i = 0; i < sections2.length; i++) {
      const section = sections2[i];
      const [sectionResult] = await pool.execute(
        'INSERT INTO sections (course_id, title, order_number) VALUES (?, ?, ?)',
        [course2Id, section.title, i]
      );

      const sectionId = sectionResult.insertId;

      for (let j = 0; j < section.lessons.length; j++) {
        const lesson = section.lessons[j];
        await pool.execute(
          'INSERT INTO lessons (section_id, title, order_number, youtube_video_id, duration) VALUES (?, ?, ?, ?, ?)',
          [sectionId, lesson.title, j, lesson.youtube_id, lesson.duration]
        );
      }
    }

    await pool.execute(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Jane Student', 'student@lms.com', hashedPassword, 'student']
    );

    console.log('Seed data created successfully!');
    console.log('Test accounts:');
    console.log('  Admin: admin@lms.com / password123');
    console.log('  Instructor: instructor@lms.com / password123');
    console.log('  Student: student@lms.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
