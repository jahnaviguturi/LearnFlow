import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import YouTube from 'react-youtube'
import api from '../services/api'
import { CheckCircle, Circle, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react'

const Learning = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [currentLesson, setCurrentLesson] = useState(null)
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const playerRef = useRef(null)

  useEffect(() => {
    fetchCourseAndProgress()
  }, [courseId])

  const fetchCourseAndProgress = async () => {
    try {
      const [courseRes, progressRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/progress/${courseId}`)
      ])

      const courseData = courseRes.data.course
      setCourse(courseData)

      const progressMap = {}
      progressRes.data.progress.forEach(p => {
        progressMap[p.lesson_id] = p.completed
      })
      setProgress(progressMap)

      const resumeRes = await api.get(`/progress/resume/${courseId}`)
      if (resumeRes.data.lesson) {
        setCurrentLesson(resumeRes.data.lesson)
      } else if (courseData.sections?.[0]?.lessons?.[0]) {
        setCurrentLesson(courseData.sections[0].lessons[0])
      }
    } catch (err) {
      console.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const handleLessonComplete = async () => {
    if (!currentLesson || progress[currentLesson.id]) return

    try {
      await api.post('/progress/complete', {
        courseId,
        lessonId: currentLesson.id
      })

      setProgress(prev => ({ ...prev, [currentLesson.id]: true }))
      
      const nextLesson = getNextLesson()
      if (nextLesson) {
        setCurrentLesson(nextLesson)
      }
    } catch (err) {
      console.error('Failed to update progress')
    }
  }

  const getNextLesson = () => {
    if (!course?.sections) return null
    
    for (let i = 0; i < course.sections.length; i++) {
      const section = course.sections[i]
      const lessonIndex = section.lessons?.findIndex(l => l.id === currentLesson?.id)
      
      if (lessonIndex !== -1 && lessonIndex < section.lessons.length - 1) {
        return section.lessons[lessonIndex + 1]
      }
      
      if (lessonIndex === section.lessons.length - 1 && i < course.sections.length - 1) {
        return course.sections[i + 1].lessons?.[0]
      }
    }
    return null
  }

  const getPrevLesson = () => {
    if (!course?.sections) return null
    
    for (let i = 0; i < course.sections.length; i++) {
      const section = course.sections[i]
      const lessonIndex = section.lessons?.findIndex(l => l.id === currentLesson?.id)
      
      if (lessonIndex > 0) {
        return section.lessons[lessonIndex - 1]
      }
      
      if (lessonIndex === 0 && i > 0) {
        const prevSection = course.sections[i - 1]
        return prevSection.lessons?.[prevSection.lessons.length - 1]
      }
    }
    return null
  }

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT?.PlayerState?.ENDED) {
      handleLessonComplete()
    }
  }

  const completedLessons = Object.values(progress).filter(Boolean).length
  const totalLessons = course?.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="learning-page">
      <div className="learning-header">
        <div className="container">
          <button onClick={() => navigate('/my-courses')} className="btn btn-sm btn-secondary">
            <ChevronLeft size={16} />
            Back to My Courses
          </button>
          <h1>{course?.title}</h1>
          <div className="progress-info">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{progressPercent}% Complete</span>
          </div>
        </div>
      </div>

      <div className="learning-container">
        <div className="video-section">
          {currentLesson && (
            <>
              <div className="video-player">
                <YouTube
                  videoId={currentLesson.youtube_video_id}
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: {
                      autoplay: 0,
                      modestbranding: 1,
                      rel: 0
                    }
                  }}
                  onStateChange={onPlayerStateChange}
                  onReady={(e) => { playerRef.current = e.target }}
                />
              </div>
              <div className="lesson-info">
                <h2>{currentLesson.title}</h2>
                <div className="lesson-navigation">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setCurrentLesson(getPrevLesson())}
                    disabled={!getPrevLesson()}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  
                  {progress[currentLesson.id] ? (
                    <span className="completed-badge">
                      <CheckCircle size={16} />
                      Completed
                    </span>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={handleLessonComplete}
                    >
                      <CheckCircle size={16} />
                      Mark Complete
                    </button>
                  )}

                  <button 
                    className="btn btn-secondary"
                    onClick={() => setCurrentLesson(getNextLesson())}
                    disabled={!getNextLesson()}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="lessons-sidebar">
          <h3>Course Content</h3>
          {course?.sections?.map((section, sIdx) => (
            <div key={section.id} className="sidebar-section">
              <div className="sidebar-section-header">
                <span>Section {sIdx + 1}</span>
                <h4>{section.title}</h4>
              </div>
              <div className="sidebar-lessons">
                {section.lessons?.map((lesson) => (
                  <button
                    key={lesson.id}
                    className={`sidebar-lesson ${currentLesson?.id === lesson.id ? 'active' : ''} ${progress[lesson.id] ? 'completed' : ''}`}
                    onClick={() => setCurrentLesson(lesson)}
                  >
                    {progress[lesson.id] ? (
                      <CheckCircle size={16} className="lesson-icon completed" />
                    ) : (
                      <PlayCircle size={16} className="lesson-icon" />
                    )}
                    <span className="lesson-title">{lesson.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Learning
