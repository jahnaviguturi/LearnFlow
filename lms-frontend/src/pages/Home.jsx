import { Link } from 'react-router-dom'
import { BookOpen, PlayCircle, Award, Users } from 'lucide-react'

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Learn Without Limits</h1>
            <p>Welcome to LearnFlow - your gateway to world-class education. Stream curated courses, track your progress, and achieve your goals.</p>
            <div className="hero-buttons">
              <Link to="/courses" className="btn btn-primary btn-lg">
                Explore Courses
              </Link>
              <Link to="/signup" className="btn btn-secondary btn-lg">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="grid grid-cols-4">
            <div className="feature-card">
              <PlayCircle size={40} />
              <h3>YouTube Integration</h3>
              <p>Learn from the best content creators on YouTube</p>
            </div>
            <div className="feature-card">
              <BookOpen size={40} />
              <h3>Structured Learning</h3>
              <p>Organized courses with sections and lessons</p>
            </div>
            <div className="feature-card">
              <Award size={40} />
              <h3>Progress Tracking</h3>
              <p>Track your learning journey and achievements</p>
            </div>
            <div className="feature-card">
              <Users size={40} />
              <h3>Expert Instructors</h3>
              <p>Learn from industry professionals</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
