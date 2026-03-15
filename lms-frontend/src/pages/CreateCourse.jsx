import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Plus, Trash2, Sparkles, Youtube, Loader2 } from 'lucide-react'
import './CreateCourse.css'

const CreateCourse = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  
  const [course, setCourse] = useState({
    title: '',
    description: '',
    category: 'Programming',
    thumbnail: '',
    sections: [{ title: '', lessons: [{ title: '', youtubeUrl: '', duration: 0 }] }]
  })

  const generateDescription = async () => {
    if (!course.title) {
      alert('Please enter a course title first')
      return
    }
    
    setAiLoading(true)
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert course creator for LearnFlow LMS. Generate compelling course descriptions.' 
            },
            { 
              role: 'user', 
              content: `Create a course description for "${course.title}" in ${course.category}. Include learning outcomes and target audience. Keep under 200 words.` 
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      })
      
      const result = await response.json()
      if (result.choices && result.choices[0]) {
        setCourse(prev => ({ ...prev, description: result.choices[0].message.content }))
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      alert('Failed to generate description')
    } finally {
      setAiLoading(false)
    }
  }

  const extractYoutubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
    return match ? match[1] : null
  }

  const addSection = () => {
    setCourse(prev => ({
      ...prev,
      sections: [...prev.sections, { title: '', lessons: [{ title: '', youtubeUrl: '', duration: 0 }] }]
    }))
  }

  const addLesson = (sectionIndex) => {
    const newSections = [...course.sections]
    newSections[sectionIndex].lessons.push({ title: '', youtubeUrl: '', duration: 0 })
    setCourse(prev => ({ ...prev, sections: newSections }))
  }

  const removeLesson = (sectionIndex, lessonIndex) => {
    const newSections = [...course.sections]
    newSections[sectionIndex].lessons.splice(lessonIndex, 1)
    setCourse(prev => ({ ...prev, sections: newSections }))
  }

  const removeSection = (sectionIndex) => {
    if (course.sections.length <= 1) return
    const newSections = [...course.sections]
    newSections.splice(sectionIndex, 1)
    setCourse(prev => ({ ...prev, sections: newSections }))
  }

  const updateLesson = (sectionIndex, lessonIndex, field, value) => {
    const newSections = [...course.sections]
    newSections[sectionIndex].lessons[lessonIndex][field] = value
    
    if (field === 'youtubeUrl') {
      const videoId = extractYoutubeId(value)
      if (videoId) {
        newSections[sectionIndex].lessons[lessonIndex].youtube_video_id = videoId
      }
    }
    
    setCourse(prev => ({ ...prev, sections: newSections }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/courses', course)
      navigate('/courses')
    } catch (err) {
      alert('Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'instructor' && user?.role !== 'admin') {
    return <div className="error">Only instructors can create courses</div>
  }

  return (
    <div className="create-course">
      <div className="page-header">
        <div className="container">
          <h1>Create New Course</h1>
          <p>Share your knowledge with the world</p>
        </div>
      </div>

      <div className="container">
        <form onSubmit={handleSubmit} className="course-form">
          <div className="form-section">
            <h2>Course Details</h2>
            
            <div className="form-group">
              <label>Course Title</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                className="form-input"
                placeholder="e.g., Advanced React Patterns"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Description
                <button 
                  type="button" 
                  onClick={generateDescription}
                  disabled={aiLoading || !course.title}
                  className="btn-ai-generate"
                >
                  {aiLoading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                  {aiLoading ? 'Generating...' : 'AI Generate'}
                </button>
              </label>
              <textarea
                value={course.description}
                onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                className="form-input"
                rows="4"
                placeholder="Describe what students will learn..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={course.category}
                  onChange={(e) => setCourse(prev => ({ ...prev, category: e.target.value }))}
                  className="form-input"
                >
                  <option value="Programming">Programming</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Database">Database</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>

              <div className="form-group">
                <label>Thumbnail URL</label>
                <input
                  type="url"
                  value={course.thumbnail}
                  onChange={(e) => setCourse(prev => ({ ...prev, thumbnail: e.target.value }))}
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Course Content</h2>
            
            {course.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="section-card">
                <div className="section-header">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => {
                      const newSections = [...course.sections]
                      newSections[sectionIndex].title = e.target.value
                      setCourse(prev => ({ ...prev, sections: newSections }))
                    }}
                    className="form-input section-title"
                    placeholder={`Section ${sectionIndex + 1} Title`}
                    required
                  />
                  {course.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(sectionIndex)}
                      className="btn-icon btn-danger"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="lessons-list">
                  {section.lessons.map((lesson, lessonIndex) => (
                    <div key={lessonIndex} className="lesson-item">
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'title', e.target.value)}
                        className="form-input"
                        placeholder="Lesson title"
                        required
                      />
                      <div className="youtube-input">
                        <Youtube size={18} />
                        <input
                          type="url"
                          value={lesson.youtubeUrl}
                          onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'youtubeUrl', e.target.value)}
                          className="form-input"
                          placeholder="YouTube URL"
                          required
                        />
                      </div>
                      {section.lessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLesson(sectionIndex, lessonIndex)}
                          className="btn-icon btn-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addLesson(sectionIndex)}
                  className="btn btn-outline btn-sm"
                >
                  <Plus size={16} /> Add Lesson
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addSection}
              className="btn btn-outline"
            >
              <Plus size={18} /> Add Section
            </button>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCourse
