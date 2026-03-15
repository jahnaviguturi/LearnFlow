import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, LogOut, Menu, X, Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import './NavbarSearch.css'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showNoResults, setShowNoResults] = useState(false)
  const searchInputRef = useRef(null)
  const searchContainerRef = useRef(null)

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false)
        setSearchQuery('')
        setSearchResults([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true)
        try {
          const response = await api.get(`/courses?search=${encodeURIComponent(searchQuery)}`)
          setSearchResults(response.data.courses.slice(0, 5))
          setShowNoResults(response.data.courses.length === 0)
        } catch (err) {
          setSearchResults([])
          setShowNoResults(true)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowNoResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchOpen(false)
      setSearchQuery('')
      setSearchResults([])
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      navigate(`/courses/${searchResults[0].id}`)
      setSearchOpen(false)
      setSearchQuery('')
      setSearchResults([])
    }
  }

  const handleResultClick = (courseId) => {
    navigate(`/courses/${courseId}`)
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          <BookOpen size={28} />
          LearnFlow
        </Link>

        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/courses" className="nav-link">Courses</Link>
          
          {/* Search Icon */}
          <button 
            className="nav-link search-toggle"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          
          {user ? (
            <>
              <Link to="/my-courses" className="nav-link">My Learning</Link>
              {(user.role === 'instructor' || user.role === 'admin') && (
                <Link to="/create-course" className="nav-link">Create Course</Link>
              )}
              <div className="user-menu">
                <span className="user-name">{user.name}</span>
                <button onClick={handleLogout} className="btn btn-sm btn-outline">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>

      {/* Search Dropdown */}
      {searchOpen && (
        <div className="search-dropdown-container" ref={searchContainerRef}>
          <div className="container">
            <div className="search-dropdown">
              <div className="search-input-wrapper">
                <Search size={20} className="search-input-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search courses, lessons, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="navbar-search-input"
                />
                {isSearching && <span className="search-loading">Searching...</span>}
              </div>
              
              {/* Search Results */}
              {(searchResults.length > 0 || showNoResults) && (
                <div className="search-results">
                  {searchResults.length > 0 ? (
                    searchResults.map((course) => (
                      <div
                        key={course.id}
                        className="search-result-item"
                        onClick={() => handleResultClick(course.id)}
                      >
                        <div className="search-result-title">{course.title}</div>
                        <div className="search-result-meta">
                          <span className="search-result-category">{course.category}</span>
                          <span className="search-result-lessons">{course.lesson_count} lessons</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="search-no-results">
                      <span>No courses found</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
