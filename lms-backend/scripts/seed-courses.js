const { pool, initDatabase } = require('../config/database');
const bcrypt = require('bcryptjs');

// Curated course data with professionally selected YouTube videos
const coursesData = [
  {
    title: 'Java Programming Masterclass',
    description: 'Complete Java programming course from basics to advanced concepts. Learn object-oriented programming, data structures, and build real-world applications.',
    category: 'Programming',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    sections: [
      {
        title: 'Java Fundamentals',
        lessons: [
          { title: 'Introduction to Java', youtube_id: 'eIrMbAQSU34', duration: 2340 },
          { title: 'Setting Up Development Environment', youtube_id: 'BGTx91t8q50', duration: 1860 },
          { title: 'Variables and Data Types', youtube_id: 'WPvGqX-TXP0', duration: 1680 },
          { title: 'Operators and Expressions', youtube_id: 'D0_R16P8PGE', duration: 1440 }
        ]
      },
      {
        title: 'Control Flow',
        lessons: [
          { title: 'If-Else Statements', youtube_id: 'mA23x39DjbI', duration: 1320 },
          { title: 'Switch Statements', youtube_id: 'vZm0lHciuQM', duration: 1080 },
          { title: 'Loops - For, While, Do-While', youtube_id: 't6gmQaTMTIw', duration: 1800 },
          { title: 'Break and Continue', youtube_id: 'pHxtKDwgddU', duration: 900 }
        ]
      },
      {
        title: 'Object-Oriented Programming',
        lessons: [
          { title: 'Classes and Objects', youtube_id: 'IUqKuGNasdM', duration: 2100 },
          { title: 'Constructors and Methods', youtube_id: 'tPFuVRbUTwA', duration: 1920 },
          { title: 'Inheritance', youtube_id: 'pTawaKysvZw', duration: 1680 },
          { title: 'Polymorphism', youtube_id: 'PrXWejkBHGk', duration: 1560 },
          { title: 'Encapsulation', youtube_id: 'j9VN_zk6_8o', duration: 1380 }
        ]
      }
    ]
  },
  {
    title: 'Python Programming Complete Guide',
    description: 'Master Python programming from scratch. Covers basics, data structures, file handling, and practical projects.',
    category: 'Programming',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
    sections: [
      {
        title: 'Python Basics',
        lessons: [
          { title: 'Introduction to Python', youtube_id: '_uQrJ0TkZlc', duration: 2760 },
          { title: 'Variables and Data Types', youtube_id: 'cQT33yu9pY8', duration: 1440 },
          { title: 'String Manipulation', youtube_id: 'k9TUPpGqYTo', duration: 1680 },
          { title: 'Input and Output', youtube_id: '4OX49nCX3Nw', duration: 1200 }
        ]
      },
      {
        title: 'Control Structures',
        lessons: [
          { title: 'Conditional Statements', youtube_id: 'f4KOjWSKZog', duration: 1380 },
          { title: 'For Loops', youtube_id: '0ZvaDa8eJ5E', duration: 1560 },
          { title: 'While Loops', youtube_id: 'J8dkgM8Mck0', duration: 1320 },
          { title: 'List Comprehensions', youtube_id: 'AhSvKGTh28Q', duration: 1140 }
        ]
      },
      {
        title: 'Functions and Modules',
        lessons: [
          { title: 'Defining Functions', youtube_id: '9Os0o3wzS_I', duration: 1800 },
          { title: 'Parameters and Arguments', youtube_id: 'CGRKqno_kUg', duration: 1620 },
          { title: 'Lambda Functions', youtube_id: 'hYzwCsKGRrg', duration: 1080 },
          { title: 'Modules and Packages', youtube_id: '1RuMJ53CKds', duration: 1920 }
        ]
      }
    ]
  },
  {
    title: 'Data Analytics with Python',
    description: 'Learn data analysis using Python, Pandas, NumPy, and Matplotlib. Transform raw data into actionable insights.',
    category: 'Data Science',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    sections: [
      {
        title: 'Introduction to Data Analytics',
        lessons: [
          { title: 'What is Data Analytics?', youtube_id: 'yZvFH7B6gKI', duration: 900 },
          { title: 'Setting Up Python for Data Analysis', youtube_id: 'r-uOLxNrNk8', duration: 1200 },
          { title: 'Introduction to NumPy', youtube_id: 'QUT1VHiLmmI', duration: 2340 },
          { title: 'NumPy Arrays and Operations', youtube_id: '8Mpc9ukltVA', duration: 1980 }
        ]
      },
      {
        title: 'Pandas for Data Manipulation',
        lessons: [
          { title: 'Introduction to Pandas', youtube_id: 'ZyhVh-qRZPA', duration: 1800 },
          { title: 'DataFrames and Series', youtube_id: '2uvysYbKdjM', duration: 2160 },
          { title: 'Data Cleaning', youtube_id: 'iaZQF8SLHJs', duration: 2520 },
          { title: 'Data Transformation', youtube_id: '0j8fr1Hf8yM', duration: 2040 }
        ]
      },
      {
        title: 'Data Visualization',
        lessons: [
          { title: 'Introduction to Matplotlib', youtube_id: 'OZOOLe2imFo', duration: 1680 },
          { title: 'Creating Charts and Graphs', youtube_id: '0P7QNZIQm3I', duration: 2100 },
          { title: 'Seaborn for Statistical Plots', youtube_id: '6GUZXDef2U0', duration: 1860 },
          { title: 'Interactive Visualizations', youtube_id: 'hR7faP6yC0k', duration: 1560 }
        ]
      }
    ]
  },
  {
    title: 'Machine Learning Fundamentals',
    description: 'Introduction to machine learning algorithms, model training, and practical applications using Python and scikit-learn.',
    category: 'Data Science',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
    sections: [
      {
        title: 'ML Basics',
        lessons: [
          { title: 'Introduction to Machine Learning', youtube_id: 'ukzFI9rgwfU', duration: 1680 },
          { title: 'Types of Machine Learning', youtube_id: '1FZ0A1QCMWc', duration: 1440 },
          { title: 'Setting Up ML Environment', youtube_id: 'ujTzv8E80Eg', duration: 1200 },
          { title: 'Introduction to scikit-learn', youtube_id: '0Lt9w-BxKFQ', duration: 1920 }
        ]
      },
      {
        title: 'Supervised Learning',
        lessons: [
          { title: 'Linear Regression', youtube_id: 'E5RjzSK0fvY', duration: 2160 },
          { title: 'Logistic Regression', youtube_id: 'yIYKR4sgzI8', duration: 1860 },
          { title: 'Decision Trees', youtube_id: 'ZVR2Way4nwQ', duration: 2040 },
          { title: 'Random Forests', youtube_id: 'J4Wdy0Wc_xQ', duration: 1740 }
        ]
      },
      {
        title: 'Model Evaluation',
        lessons: [
          { title: 'Train-Test Split', youtube_id: 'pFdfnIGAGCk', duration: 1380 },
          { title: 'Cross-Validation', youtube_id: 'fSytzGwwBVw', duration: 1620 },
          { title: 'Performance Metrics', youtube_id: 'Kdsp6soqA7o', duration: 1800 },
          { title: 'Overfitting and Underfitting', youtube_id: 'mQGwjrStQgg', duration: 1560 }
        ]
      }
    ]
  },
  {
    title: 'Web Development Bootcamp',
    description: 'Complete web development course covering HTML, CSS, JavaScript, and modern web development practices.',
    category: 'Web Development',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    sections: [
      {
        title: 'HTML5 Fundamentals',
        lessons: [
          { title: 'Introduction to HTML', youtube_id: 'qz0aGYrrlhU', duration: 2580 },
          { title: 'HTML Document Structure', youtube_id: 'bWPMSSsVdPk', duration: 1860 },
          { title: 'Forms and Input Elements', youtube_id: 'fNcJuPIZ2WE', duration: 2280 },
          { title: 'Semantic HTML', youtube_id: 'kGW8Al_cga4', duration: 1620 }
        ]
      },
      {
        title: 'CSS3 Styling',
        lessons: [
          { title: 'CSS Basics and Selectors', youtube_id: '1PnVor36_40', duration: 2100 },
          { title: 'Box Model and Layout', youtube_id: 'rIO5326FgPE', duration: 1920 },
          { title: 'Flexbox Layout', youtube_id: 'JJSoEo8JSnc', duration: 2340 },
          { title: 'CSS Grid', youtube_id: '9zBsdzdE4rM', duration: 1980 },
          { title: 'Responsive Design', youtube_id: 'srvUrASNj0s', duration: 2160 }
        ]
      },
      {
        title: 'JavaScript Essentials',
        lessons: [
          { title: 'JavaScript Basics', youtube_id: 'PkZNo7MFNFg', duration: 2880 },
          { title: 'DOM Manipulation', youtube_id: '5fb2aPlgoys', duration: 2040 },
          { title: 'Event Handling', youtube_id: 'XF1_MlZ5l6M', duration: 1680 },
          { title: 'Fetch API and AJAX', youtube_id: 'cuEtnrL9-H0', duration: 1860 }
        ]
      }
    ]
  },
  {
    title: 'React.js Complete Course',
    description: 'Master React.js from basics to advanced. Learn hooks, context, Redux, and build modern single-page applications.',
    category: 'Web Development',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    sections: [
      {
        title: 'React Fundamentals',
        lessons: [
          { title: 'Introduction to React', youtube_id: 'w7ejDZ8SWv8', duration: 2040 },
          { title: 'Components and JSX', youtube_id: 'Ke90Tje7VS0', duration: 2340 },
          { title: 'Props and State', youtube_id: '4ORZ1GmjaMc', duration: 1920 },
          { title: 'Event Handling', youtube_id: 'Znqv84xi8Ug', duration: 1560 }
        ]
      },
      {
        title: 'React Hooks',
        lessons: [
          { title: 'useState Hook', youtube_id: 'O6P86uwfdR0', duration: 1680 },
          { title: 'useEffect Hook', youtube_id: '0ZJgIjIuY7U', duration: 2100 },
          { title: 'useContext Hook', youtube_id: '5LrDIWkK_Bc', duration: 1440 },
          { title: 'Custom Hooks', youtube_id: 'J-gB7lAwgLI', duration: 1860 }
        ]
      },
      {
        title: 'Advanced React',
        lessons: [
          { title: 'React Router', youtube_id: 'Law7wfdg_ls', duration: 2280 },
          { title: 'Context API', youtube_id: '35lXkAzyh5c', duration: 1740 },
          { title: 'Redux Fundamentals', youtube_id: 'poQXNp9ItL4', duration: 2460 },
          { title: 'Performance Optimization', youtube_id: 'tGLCuoumaGY', duration: 1620 }
        ]
      }
    ]
  },
  {
    title: 'SQL & Database Mastery',
    description: 'Comprehensive SQL course covering queries, database design, normalization, and working with MySQL and PostgreSQL.',
    category: 'Database',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
    sections: [
      {
        title: 'SQL Fundamentals',
        lessons: [
          { title: 'Introduction to Databases', youtube_id: 'HXV3zeQKqGY', duration: 1980 },
          { title: 'SELECT Statements', youtube_id: '9Pzj7Aj25lw', duration: 2220 },
          { title: 'WHERE Clause and Operators', youtube_id: 'Yh4CrPHVBdE', duration: 1860 },
          { title: 'Sorting and Limiting Results', youtube_id: '9Pzj7Aj25lw', duration: 1440 }
        ]
      },
      {
        title: 'Data Manipulation',
        lessons: [
          { title: 'INSERT Statements', youtube_id: '2Fn0YJ6_6y4', duration: 1320 },
          { title: 'UPDATE and DELETE', youtube_id: 'fXqE2ZcWstA', duration: 1560 },
          { title: 'JOIN Operations', youtube_id: '9yeOJ0ZMUYw', duration: 2100 },
          { title: 'Aggregate Functions', youtube_id: 'LHKbP7a2-2w', duration: 1740 }
        ]
      },
      {
        title: 'Database Design',
        lessons: [
          { title: 'Database Normalization', youtube_id: 'GFQaEYEc8z8', duration: 1920 },
          { title: 'Primary and Foreign Keys', youtube_id: '8wUUMOKAK-c', duration: 1680 },
          { title: 'Indexes and Optimization', youtube_id: '3G7XyJ5QOpQ', duration: 2040 },
          { title: 'Transactions', youtube_id: 'h0j0l3F4q3E', duration: 1560 }
        ]
      }
    ]
  },
  {
    title: 'Data Structures & Algorithms',
    description: 'Master essential data structures and algorithms. Prepare for coding interviews with practical implementations.',
    category: 'Computer Science',
    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
    sections: [
      {
        title: 'Introduction to Algorithms',
        lessons: [
          { title: 'What are Algorithms?', youtube_id: '0IAPZzGSbME', duration: 1800 },
          { title: 'Time and Space Complexity', youtube_id: 'D6xkbGLQesk', duration: 2100 },
          { title: 'Big O Notation', youtube_id: 'BgLTDTAQu2Y', duration: 1920 },
          { title: 'Analyzing Algorithms', youtube_id: 'Z0bH0cMYkE8', duration: 1680 }
        ]
      },
      {
        title: 'Linear Data Structures',
        lessons: [
          { title: 'Arrays and Dynamic Arrays', youtube_id: 'BzYMFd-lQL4', duration: 2040 },
          { title: 'Linked Lists', youtube_id: 'R9PTBwOzceo', duration: 2280 },
          { title: 'Stacks', youtube_id: 'wjI1WNcIntg', duration: 1860 },
          { title: 'Queues', youtube_id: 'XuCbpw6Bj1U', duration: 1740 }
        ]
      },
      {
        title: 'Non-Linear Data Structures',
        lessons: [
          { title: 'Binary Trees', youtube_id: 'qH6yxkw0u78', duration: 2160 },
          { title: 'Binary Search Trees', youtube_id: 'pYT9F8_LFTM', duration: 1980 },
          { title: 'Graphs', youtube_id: 'tWVWeAqZ0WU', duration: 2340 },
          { title: 'Hash Tables', youtube_id: 'shs0KM3wKv8', duration: 1860 }
        ]
      },
      {
        title: 'Sorting and Searching',
        lessons: [
          { title: 'Bubble and Selection Sort', youtube_id: 'n4kb6I7MRZo', duration: 1620 },
          { title: 'Merge Sort and Quick Sort', youtube_id: 'Hoixgm4-P4M', duration: 2100 },
          { title: 'Binary Search', youtube_id: 'j5uXyPJ0Pew', duration: 1440 },
          { title: 'Graph Traversal - BFS & DFS', youtube_id: 'pcKY4hjDrxk', duration: 2280 }
        ]
      }
    ]
  }
];

const seedCourses = async () => {
  try {
    console.log('Starting course seeding...');
    
    // Check if instructor exists, create if not
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    let [instructors] = await pool.execute(
      "SELECT id FROM users WHERE role = 'instructor' LIMIT 1"
    );
    
    let instructorId;
    if (instructors.length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['John Instructor', 'instructor@lms.com', hashedPassword, 'instructor']
      );
      instructorId = result.insertId;
      console.log('Created instructor user');
    } else {
      instructorId = instructors[0].id;
    }

    // Seed each course
    for (const courseData of coursesData) {
      // Check if course already exists
      const [existing] = await pool.execute(
        'SELECT id FROM courses WHERE title = ?',
        [courseData.title]
      );
      
      if (existing.length > 0) {
        console.log(`Course "${courseData.title}" already exists, skipping...`);
        continue;
      }

      // Insert course
      const [courseResult] = await pool.execute(
        'INSERT INTO courses (title, description, thumbnail, category, instructor_id) VALUES (?, ?, ?, ?, ?)',
        [courseData.title, courseData.description, courseData.thumbnail, courseData.category, instructorId]
      );

      const courseId = courseResult.insertId;
      console.log(`Created course: ${courseData.title}`);

      // Insert sections and lessons
      for (let sectionIndex = 0; sectionIndex < courseData.sections.length; sectionIndex++) {
        const section = courseData.sections[sectionIndex];
        
        const [sectionResult] = await pool.execute(
          'INSERT INTO sections (course_id, title, order_number) VALUES (?, ?, ?)',
          [courseId, section.title, sectionIndex]
        );

        const sectionId = sectionResult.insertId;

        for (let lessonIndex = 0; lessonIndex < section.lessons.length; lessonIndex++) {
          const lesson = section.lessons[lessonIndex];
          
          await pool.execute(
            'INSERT INTO lessons (section_id, title, order_number, youtube_video_id, duration) VALUES (?, ?, ?, ?, ?)',
            [sectionId, lesson.title, lessonIndex, lesson.youtube_id, lesson.duration]
          );
        }
      }
      
      console.log(`  - Added ${courseData.sections.length} sections with lessons`);
    }

    console.log('\n✅ Course seeding completed successfully!');
    console.log('\nAvailable courses:');
    const [allCourses] = await pool.execute('SELECT title, category FROM courses ORDER BY category');
    allCourses.forEach(c => console.log(`  - [${c.category}] ${c.title}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedCourses();
