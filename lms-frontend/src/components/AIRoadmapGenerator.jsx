import { useState } from 'react'
import api from '../services/api'
import { Sparkles, Target, Clock, BookOpen, Loader2 } from 'lucide-react'
import './AIRoadmapGenerator.css'

const AIRoadmapGenerator = () => {
  const [goal, setGoal] = useState('')
  const [currentSkills, setCurrentSkills] = useState('')
  const [loading, setLoading] = useState(false)
  const [roadmap, setRoadmap] = useState(null)

  const generateRoadmap = async () => {
    if (!goal.trim()) return
    
    setLoading(true)
    try {
      const response = await api.post('/ai/roadmap', {
        goal,
        currentSkills: currentSkills.split(',').map(s => s.trim()).filter(Boolean)
      })
      setRoadmap(response.data.roadmap)
    } catch (error) {
      console.error('Failed to generate roadmap:', error)
      alert('Failed to generate roadmap. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-roadmap-generator">
      <div className="roadmap-header">
        <Sparkles className="icon" />
        <h2>AI Learning Roadmap</h2>
        <p>Get a personalized learning path powered by AI</p>
      </div>

      <div className="roadmap-input">
        <div className="form-group">
          <label>
            <Target size={16} />
            Your Goal
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Become a Full Stack Developer"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>
            <BookOpen size={16} />
            Current Skills (optional)
          </label>
          <input
            type="text"
            value={currentSkills}
            onChange={(e) => setCurrentSkills(e.target.value)}
            placeholder="e.g., HTML, CSS, Basic JavaScript"
            className="form-input"
          />
        </div>

        <button
          onClick={generateRoadmap}
          disabled={loading || !goal.trim()}
          className="btn btn-primary btn-lg"
        >
          {loading ? (
            <>
              <Loader2 className="spin" size={20} />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Roadmap
            </>
          )}
        </button>
      </div>

      {roadmap && (
        <div className="roadmap-result">
          <div className="roadmap-stats">
            <div className="stat">
              <Clock size={20} />
              <span>{roadmap.totalEstimatedWeeks} weeks</span>
            </div>
            <div className="stat">
              <Target size={20} />
              <span>{roadmap.difficulty}</span>
            </div>
          </div>

          <div className="roadmap-steps">
            {roadmap.roadmap.map((step, index) => (
              <div key={index} className="roadmap-step">
                <div className="step-number">{step.step}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <div className="step-skills">
                    {step.skills.map((skill, i) => (
                      <span key={i} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                  {step.recommendedCourses && step.recommendedCourses.length > 0 && (
                    <div className="recommended-courses">
                      <strong>Recommended:</strong>
                      <ul>
                        {step.recommendedCourses.map((course, i) => (
                          <li key={i}>{course}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="step-duration">
                    <Clock size={14} />
                    {step.estimatedWeeks} weeks
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AIRoadmapGenerator
