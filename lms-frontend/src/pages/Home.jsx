import { Link } from 'react-router-dom'
import { BookOpen, Star, Users, Clock, Search, PlayCircle, Award, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../services/api'
import './Home.css'

const Home = () => {
  const [courses, setCourses] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = ['All', 'Web Dev', 'Database', 'AI', 'Design']

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses')
      setCourses(response.data.courses.slice(0, 6))
    } catch (err) {
      console.error('Failed to load courses')
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || 
      (activeCategory === 'Web Dev' && course.category?.includes('Web')) ||
      (activeCategory === 'Database' && course.category?.includes('Database')) ||
      (activeCategory === 'AI' && course.category?.includes('Data Science')) ||
      (activeCategory === 'Design' && course.category?.includes('Design'))
    return matchesSearch && matchesCategory
  })

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-gradient"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              New courses added weekly
            </div>
            <h1>Learn New Skills Anytime</h1>
            <p>Discover courses in web development, databases, AI and more. Start your learning journey today.</p>
            <div className="hero-buttons">
              <Link to="/courses" className="btn btn-primary btn-lg">
                Explore Courses
              </Link>
              <Link to="/signup" className="btn btn-secondary btn-lg">
                Get Started Free
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Courses</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">10k+</span>
                <span className="stat-label">Students</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">4.9</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div className="container">
          <div className="search-container">
            <div className="search-box">
              <Search className="search-icon" size={22} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="courses-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Courses</h2>
            <p>Hand-picked courses to help you start your journey</p>
          </div>
          <div className="courses-grid">
            {filteredCourses.map((course) => (
              <Link to={`/courses/${course.id}`} key={course.id} className="course-card-modern">
                <div className="course-image-wrapper">
                  <img src={course.thumbnail} alt={course.title} className="course-image" />
                  <span className="course-category">{course.category}</span>
                </div>
                <div className="course-content">
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description?.slice(0, 80)}...</p>
                  <div className="course-meta">
                    <div className="course-rating">
                      <Star size={14} className="star-icon" fill="#fbbf24" />
                      <span>4.8</span>
                    </div>
                    <div className="course-students">
                      <Users size={14} />
                      <span>2.4k students</span>
                    </div>
                    <div className="course-duration">
                      <Clock size={14} />
                      <span>{course.lesson_count * 15} mins</span>
                    </div>
                  </div>
                  <button className="btn-start-course">Start Course</button>
                </div>
              </Link>
            ))}
          </div>
          <div className="view-all-wrapper">
            <Link to="/courses" className="btn-view-all">
              View All Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose LearnFlow</h2>
            <p>Everything you need to succeed in your learning journey</p>
          </div>
          <div className="features-grid">
            <div className="feature-card-modern">
              <div className="feature-icon">
                <PlayCircle size={28} />
              </div>
              <h3>YouTube Integration</h3>
              <p>Learn from the best content creators with curated YouTube videos</p>
            </div>
            <div className="feature-card-modern">
              <div className="feature-icon">
                <Award size={28} />
              </div>
              <h3>Progress Tracking</h3>
              <p>Track your learning journey with detailed analytics</p>
            </div>
            <div className="feature-card-modern">
              <div className="feature-icon">
                <TrendingUp size={28} />
              </div>
              <h3>Skill Certificates</h3>
              <p>Earn certificates upon completing courses</p>
            </div>
            <div className="feature-card-modern">
              <div className="feature-icon">
                <Users size={28} />
              </div>
              <h3>Expert Instructors</h3>
              <p>Learn from industry professionals and experts</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
