import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Clock, BookOpen, User } from 'lucide-react'

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [category, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (search) params.append('search', search)
      
      const response = await api.get(`/courses?${params}`)
      setCourses(response.data.courses)
    } catch (err) {
      setError('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  if (loading) return <div className="loading">Loading courses...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1>All Courses</h1>
          <p>Discover your next learning adventure</p>
        </div>
      </div>

      <div className="container">
        <div className="filters">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="form-input search-input"
          />
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="form-input"
          >
            <option value="">All Categories</option>
            <option value="Programming">Programming</option>
            <option value="Data Science">Data Science</option>
            <option value="Web Development">Web Development</option>
            <option value="Database">Database</option>
            <option value="Computer Science">Computer Science</option>
          </select>
        </div>

        <div className="grid grid-cols-3">
          {courses.map(course => (
            <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
              <div className="course-thumbnail">
                <img src={course.thumbnail} alt={course.title} />
              </div>
              <div className="course-content">
                <span className="badge badge-primary">{course.category}</span>
                <h3>{course.title}</h3>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  <span><User size={14} /> {course.instructor_name}</span>
                  <span><BookOpen size={14} /> {course.lesson_count} lessons</span>
                  <span><Clock size={14} /> {formatDuration(course.total_duration)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="empty-state">
            <BookOpen className="empty-state-icon" />
            <h3>No courses found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses
