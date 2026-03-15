const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// AI Course Roadmap Generator
router.post('/roadmap', authenticate, async (req, res) => {
  try {
    const { goal, currentSkills = [] } = req.body;
    const userId = req.user.id;

    // Get user's enrolled courses
    const [enrolledCourses] = await pool.execute(`
      SELECT c.title, c.category, c.id
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
    `, [userId]);

    // Get all available courses
    const [availableCourses] = await pool.execute(`
      SELECT c.title, c.category, c.id, c.description
      FROM courses c
      WHERE c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
    `, [userId]);

    const prompt = `Create a personalized learning roadmap for a student who wants to become a ${goal}.

Current Skills: ${currentSkills.join(', ') || 'Beginner'}
Already Enrolled: ${enrolledCourses.map(c => c.title).join(', ') || 'None'}
Available Courses: ${availableCourses.map(c => `${c.title} (${c.category})`).join(', ')}

Create a step-by-step roadmap with 5-7 steps. For each step, recommend specific courses from the available list.

Format as JSON:
{
  "roadmap": [
    {
      "step": 1,
      "title": "Step Title",
      "description": "What to learn",
      "skills": ["skill1", "skill2"],
      "recommendedCourses": ["Course Name"],
      "estimatedWeeks": 2
    }
  ],
  "totalEstimatedWeeks": 12,
  "difficulty": "Beginner/Intermediate/Advanced"
}`;

    const response = await axios.post(GROQ_API_URL, {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an expert learning path advisor for an LMS platform.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const aiResponse = response.data.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const roadmap = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    res.json({ roadmap, rawResponse: aiResponse });
  } catch (error) {
    console.error('AI Roadmap Error:', error);
    res.status(500).json({ message: 'Failed to generate roadmap', error: error.message });
  }
});

// AI Video Chapter Generator
router.post('/chapters', authenticate, async (req, res) => {
  try {
    const { videoTitle, duration, transcript } = req.body;

    const prompt = `Analyze this educational video and create chapters with timestamps.

Video Title: ${videoTitle}
Duration: ${duration} seconds
${transcript ? `Transcript: ${transcript.substring(0, 3000)}` : ''}

Create 5-8 chapters with timestamps. Format as JSON:
{
  "chapters": [
    {
      "title": "Chapter Title",
      "timestamp": "MM:SS",
      "seconds": 120,
      "description": "Brief description of content"
    }
  ]
}`;

    const response = await axios.post(GROQ_API_URL, {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an expert at analyzing educational videos and creating chapter breakdowns.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.5
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const aiResponse = response.data.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const chapters = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    res.json({ chapters, rawResponse: aiResponse });
  } catch (error) {
    console.error('AI Chapters Error:', error);
    res.status(500).json({ message: 'Failed to generate chapters', error: error.message });
  }
});

// AI Notes Generator
router.post('/notes', authenticate, async (req, res) => {
  try {
    const { videoTitle, transcript, lessonTitle } = req.body;

    const prompt = `Generate comprehensive study notes from this educational video.

Course/Lesson: ${lessonTitle || videoTitle}
Transcript: ${transcript.substring(0, 4000)}

Create structured notes with:
1. Key concepts
2. Important definitions
3. Code examples (if applicable)
4. Summary points

Format as JSON:
{
  "notes": {
    "overview": "Brief overview",
    "keyConcepts": ["concept1", "concept2"],
    "definitions": [{"term": "term", "definition": "definition"}],
    "codeExamples": [{"language": "javascript", "code": "code here"}],
    "summary": ["point1", "point2"],
    "flashcards": [{"question": "Q", "answer": "A"}]
  }
}`;

    const response = await axios.post(GROQ_API_URL, {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an expert at creating educational study notes.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.5
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const aiResponse = response.data.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const notes = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    res.json({ notes, rawResponse: aiResponse });
  } catch (error) {
    console.error('AI Notes Error:', error);
    res.status(500).json({ message: 'Failed to generate notes', error: error.message });
  }
});

// AI Course Builder from Playlist
router.post('/build-course', authenticate, async (req, res) => {
  try {
    const { playlistData } = req.body;
    // playlistData: [{title, duration, videoId}]

    const videosInfo = playlistData.map(v => 
      `Title: ${v.title}, Duration: ${v.duration}s`
    ).join('\n');

    const prompt = `Create a complete course structure from this YouTube playlist.

Videos:
${videosInfo}

Generate:
1. Course Title
2. Course Description
3. Category
4. Organize videos into 3-5 logical sections
5. Skills students will learn
6. Estimated total duration
7. Difficulty level

Format as JSON:
{
  "course": {
    "title": "Course Title",
    "description": "Course description",
    "category": "Programming",
    "difficulty": "Beginner",
    "totalDuration": "10 hours",
    "skills": ["skill1", "skill2"]
  },
  "sections": [
    {
      "title": "Section Title",
      "description": "What this section covers",
      "lessons": [{"title": "Lesson Title", "duration": 600}]
    }
  ]
}`;

    const response = await axios.post(GROQ_API_URL, {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an expert curriculum designer for online courses.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const aiResponse = response.data.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const courseStructure = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    res.json({ courseStructure, rawResponse: aiResponse });
  } catch (error) {
    console.error('AI Course Builder Error:', error);
    res.status(500).json({ message: 'Failed to build course', error: error.message });
  }
});

// AI Smart Search
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;

    // Get all courses
    const [courses] = await pool.execute(`
      SELECT c.*, u.name as instructor_name
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
    `);

    const coursesInfo = courses.map(c => 
      `ID: ${c.id}, Title: ${c.title}, Category: ${c.category}, Description: ${c.description?.substring(0, 200)}`
    ).join('\n');

    const prompt = `User is searching for: "${query}"

Available Courses:
${coursesInfo}

Recommend the top 5 most relevant courses. Consider:
- Direct keyword matches
- Related topics
- Learning path relevance

Format as JSON:
{
  "recommendations": [
    {
      "courseId": 1,
      "relevanceScore": 95,
      "reason": "Why this course matches"
    }
  ],
  "suggestedQuery": "improved search query"
}`;

    const response = await axios.post(GROQ_API_URL, {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an intelligent course recommendation system.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.3
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const aiResponse = response.data.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const searchResults = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    // Map back to full course objects
    if (searchResults && searchResults.recommendations) {
      searchResults.courses = searchResults.recommendations
        .map(rec => courses.find(c => c.id === rec.courseId))
        .filter(Boolean);
    }

    res.json(searchResults);
  } catch (error) {
    console.error('AI Search Error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// AI Recommendations
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's enrolled and completed courses
    const [userCourses] = await pool.execute(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM progress WHERE user_id = ? AND course_id = c.id AND completed = 1) as completed_lessons,
        (SELECT COUNT(*) FROM lessons WHERE section_id IN (SELECT id FROM sections WHERE course_id = c.id)) as total_lessons
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
    `, [userId, userId]);

    const completedCourses = userCourses.filter(c => c.completed_lessons === c.total_lessons);
    const inProgressCourses = userCourses.filter(c => c.completed_lessons < c.total_lessons);

    // Get available courses
    const [availableCourses] = await pool.execute(`
      SELECT c.*, u.name as instructor_name
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      WHERE c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
    `, [userId]);

    const prompt = `Recommend courses for this student.

Completed: ${completedCourses.map(c => `${c.title} (${c.category})`).join(', ') || 'None'}
In Progress: ${inProgressCourses.map(c => `${c.title} (${c.category})`).join(', ') || 'None'}
Available: ${availableCourses.map(c => `${c.title} (${c.category})`).join(', ')}

Recommend 5 courses that would be the next logical step. Format as JSON:
{
  "recommendations": [
    {
      "courseId": 1,
      "reason": "Why this course",
      "relevanceScore": 90
    }
  ]
}`;

    const response = await axios.post(GROQ_API_URL, {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a personalized learning recommendation engine.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.5
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const aiResponse = response.data.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (recommendations && recommendations.recommendations) {
      recommendations.courses = recommendations.recommendations
        .map(rec => availableCourses.find(c => c.id === rec.courseId))
        .filter(Boolean);
    }

    res.json(recommendations);
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    res.status(500).json({ message: 'Failed to get recommendations', error: error.message });
  }
});

module.exports = router;
