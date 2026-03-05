import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Clock, BookOpen, User, CheckCircle, PlayCircle } from 'lucide-react'

const CourseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)

  useEffect(() => {
    fetchCourse()
    if (user) {
      checkEnrollment()
    }
  }, [id, user])

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`)
      setCourse(response.data.course)
    } catch (err) {
      console.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const checkEnrollment = async () => {
    try {
      const response = await api.get(`/enrollments/check/${id}`)
      setIsEnrolled(response.data.enrolled)
    } catch (err) {
      console.error('Failed to check enrollment')
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      setEnrolling(true)
      await api.post(`/enrollments/${id}`)
      setIsEnrolled(true)
      navigate(`/learning/${id}`)
    } catch (err) {
      alert('Failed to enroll. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
  }

  if (loading) return <div className="loading">Loading course...</div>
  if (!course) return <div className="error">Course not found</div>

  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0

  return (
    <div className="course-detail">
      <div className="page-header">
        <div className="container">
          <span className="badge badge-primary">{course.category}</span>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>
      </div>

      <div className="container">
        <div className="course-detail-grid">
          <div className="course-main">
            <div className="card">
              <div className="card-body">
                <h2>What you&apos;ll learn</h2>
                <div className="learning-outcomes">
                  <div className="outcome-item">
                    <CheckCircle size={20} />
                    <span>Master core concepts through structured lessons</span>
                  </div>
                  <div className="outcome-item">
                    <CheckCircle size={20} />
                    <span>Build practical skills with hands-on examples</span>
                  </div>
                  <div className="outcome-item">
                    <CheckCircle size={20} />
                    <span>Learn at your own pace with lifetime access</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card course-content">
              <div className="card-body">
                <h2>Course Content</h2>
                <div className="content-stats">
                  <span>{course.sections?.length || 0} sections</span>
                  <span>•</span>
                  <span>{totalLessons} lessons</span>
                  <span>•</span>
                  <span>{formatDuration(course.total_duration)} total</span>
                </div>

                {course.sections?.map((section, idx) => (
                  <div key={section.id} className="section">
                    <div className="section-header">
                      <h3>Section {idx + 1}: {section.title}</h3>
                      <span>{section.lessons?.length || 0} lessons</span>
                    </div>
                    <div className="lessons-list">
                      {section.lessons?.map((lesson) => (
                        <div key={lesson.id} className="lesson-item">
                          <PlayCircle size={16} />
                          <span>{lesson.title}</span>
                          <span className="lesson-duration">{formatDuration(lesson.duration)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="course-sidebar">
            <div className="card enrollment-card">
              <img src={course.thumbnail} alt={course.title} />
              <div className="card-body">
                <div className="instructor-info">
                  <User size={20} />
                  <span>{course.instructor_name}</span>
                </div>
                
                {isEnrolled ? (
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate(`/learning/${id}`)}
                  >
                    Continue Learning
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}

                <div className="course-stats">
                  <div className="stat">
                    <BookOpen size={16} />
                    <span>{totalLessons} lessons</span>
                  </div>
                  <div className="stat">
                    <Clock size={16} />
                    <span>{formatDuration(course.total_duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail
