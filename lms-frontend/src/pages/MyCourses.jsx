import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Clock, BookOpen, PlayCircle } from 'lucide-react'

const MyCourses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyCourses()
  }, [])

  const fetchMyCourses = async () => {
    try {
      const response = await api.get('/enrollments/my-courses')
      setCourses(response.data.courses)
    } catch (err) {
      console.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  if (loading) return <div className="loading">Loading your courses...</div>

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>My Learning</h1>
          <p>Continue where you left off</p>
        </div>
      </div>

      <div className="container">
        {courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen className="empty-state-icon" />
            <h3>You haven&apos;t enrolled in any courses yet</h3>
            <p>Explore our courses and start learning today</p>
            <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
          </div>
        ) : (
          <div className="grid grid-cols-3">
            {courses.map(course => (
              <div key={course.id} className="card my-course-card">
                <div className="course-thumbnail">
                  <img src={course.thumbnail} alt={course.title} />
                  <div className="progress-overlay">
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${course.progress_percent}%` }}
                      />
                    </div>
                    <span>{course.progress_percent}%</span>
                  </div>
                </div>
                <div className="card-body">
                  <h3>{course.title}</h3>
                  <div className="course-meta">
                    <span><BookOpen size={14} /> {course.total_lessons} lessons</span>
                    <span><Clock size={14} /> {formatDuration(course.total_duration || 0)}</span>
                  </div>
                  <Link 
                    to={`/learning/${course.id}`} 
                    className="btn btn-primary"
                  >
                    <PlayCircle size={16} />
                    {course.progress_percent === 0 ? 'Start Course' : 
                     course.progress_percent === 100 ? 'Review Course' : 'Continue'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyCourses
