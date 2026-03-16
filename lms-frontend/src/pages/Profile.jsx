import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { 
  Award, BookOpen, Clock, Trophy, Flame, Star, 
  Map, Edit2, Github, Linkedin, Twitter, Globe,
  CheckCircle, Lock, PlayCircle, TrendingUp
} from 'lucide-react'
import './Profile.css'

const Profile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [skillTree, setSkillTree] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    fetchProfile()
    fetchSkillTree()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile')
      setProfile(response.data)
      setEditForm({
        bio: response.data.user.bio,
        banner_url: response.data.user.banner_url,
        theme_color: response.data.user.theme_color,
        social_links: response.data.user.social_links || {}
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSkillTree = async () => {
    try {
      const response = await api.get('/users/skill-tree')
      setSkillTree(response.data.skillTree)
    } catch (error) {
      console.error('Failed to fetch skill tree:', error)
    }
  }

  const saveProfile = async () => {
    try {
      await api.put('/users/profile', editForm)
      setEditing(false)
      fetchProfile()
    } catch (error) {
      alert('Failed to save profile')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="status-icon completed" size={20} />
      case 'in_progress':
        return <PlayCircle className="status-icon in-progress" size={20} />
      default:
        return <Lock className="status-icon locked" size={20} />
    }
  }

  const getStatusClass = (status) => {
    return `skill-node ${status}`
  }

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>
  }

  if (!profile) {
    return <div className="profile-error">Failed to load profile</div>
  }

  const { user: userData, stats, badges, certificates, skills } = profile

  return (
    <div className="profile-page">
      {/* Banner */}
      <div 
        className="profile-banner"
        style={{ 
          backgroundImage: userData.banner_url ? `url(${userData.banner_url})` : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          backgroundColor: userData.theme_color
        }}
      >
        <div className="profile-banner-overlay">
          <div className="container">
            <div className="profile-header">
              <div className="profile-avatar">
                {userData.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h1>{userData.name}</h1>
                <p className="profile-role">{userData.role}</p>
                {!editing ? (
                  <p className="profile-bio">{userData.bio || 'No bio yet'}</p>
                ) : (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                )}
              </div>
              <div className="profile-actions">
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="btn btn-outline">
                    <Edit2 size={16} />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={() => setEditing(false)} className="btn btn-ghost">Cancel</button>
                    <button onClick={saveProfile} className="btn btn-primary">Save</button>
                  </>
                )}
              </div>
            </div>

            {editing && (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label>Banner URL</label>
                  <input
                    type="url"
                    value={editForm.banner_url}
                    onChange={(e) => setEditForm({...editForm, banner_url: e.target.value})}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
                <div className="form-group">
                  <label>Theme Color</label>
                  <input
                    type="color"
                    value={editForm.theme_color}
                    onChange={(e) => setEditForm({...editForm, theme_color: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Social Links</label>
                  <div className="social-inputs">
                    <input
                      type="url"
                      placeholder="GitHub URL"
                      value={editForm.social_links.github || ''}
                      onChange={(e) => setEditForm({
                        ...editForm, 
                        social_links: {...editForm.social_links, github: e.target.value}
                      })}
                    />
                    <input
                      type="url"
                      placeholder="LinkedIn URL"
                      value={editForm.social_links.linkedin || ''}
                      onChange={(e) => setEditForm({
                        ...editForm, 
                        social_links: {...editForm.social_links, linkedin: e.target.value}
                      })}
                    />
                    <input
                      type="url"
                      placeholder="Twitter URL"
                      value={editForm.social_links.twitter || ''}
                      onChange={(e) => setEditForm({
                        ...editForm, 
                        social_links: {...editForm.social_links, twitter: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {!editing && userData.social_links && (
              <div className="social-links">
                {userData.social_links.github && (
                  <a href={userData.social_links.github} target="_blank" rel="noopener noreferrer">
                    <Github size={20} />
                  </a>
                )}
                {userData.social_links.linkedin && (
                  <a href={userData.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin size={20} />
                  </a>
                )}
                {userData.social_links.twitter && (
                  <a href={userData.social_links.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter size={20} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <BookOpen className="stat-icon" />
            <div className="stat-value">{stats.total_enrolled}</div>
            <div className="stat-label">Courses Enrolled</div>
          </div>
          <div className="stat-card">
            <Award className="stat-icon" />
            <div className="stat-value">{stats.completed_courses}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <Clock className="stat-icon" />
            <div className="stat-value">{stats.total_learning_hours}h</div>
            <div className="stat-label">Learning Time</div>
          </div>
          <div className="stat-card">
            <Trophy className="stat-icon" />
            <div className="stat-value">{stats.certificates_earned}</div>
            <div className="stat-label">Certificates</div>
          </div>
          <div className="stat-card">
            <Flame className="stat-icon" />
            <div className="stat-value">{stats.current_streak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-card">
            <Star className="stat-icon" />
            <div className="stat-value">{badges.length}</div>
            <div className="stat-label">Badges Earned</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={18} />
            Overview
          </button>
          <button 
            className={activeTab === 'skills' ? 'active' : ''}
            onClick={() => setActiveTab('skills')}
          >
            <Map size={18} />
            Skill Tree
          </button>
          <button 
            className={activeTab === 'badges' ? 'active' : ''}
            onClick={() => setActiveTab('badges')}
          >
            <Trophy size={18} />
            Badges
          </button>
          <button 
            className={activeTab === 'certificates' ? 'active' : ''}
            onClick={() => setActiveTab('certificates')}
          >
            <Award size={18} />
            Certificates
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Skills Progress */}
              <div className="skills-section">
                <h3>Skill Progress</h3>
                <div className="skills-list">
                  {skills.map((skill) => (
                    <div key={skill.category} className="skill-item">
                      <div className="skill-header">
                        <span className="skill-name">{skill.category}</span>
                        <span className="skill-percent">{skill.progress_percent}%</span>
                      </div>
                      <div className="skill-bar">
                        <div 
                          className="skill-progress"
                          style={{ width: `${skill.progress_percent}%` }}
                        />
                      </div>
                      <div className="skill-stats">
                        {skill.completed_courses} / {skill.total_courses} courses
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Certificates */}
              {certificates.length > 0 && (
                <div className="recent-certificates">
                  <h3>Recent Certificates</h3>
                  <div className="certificates-grid">
                    {certificates.slice(0, 3).map((cert) => (
                      <div key={cert.id} className="certificate-card">
                        <img src={cert.thumbnail} alt={cert.course_title} />
                        <div className="certificate-info">
                          <h4>{cert.course_title}</h4>
                          <p>{new Date(cert.completion_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && skillTree && (
            <div className="skills-tree-tab">
              <h3>Learning Path</h3>
              {Object.entries(skillTree).map(([category, courses]) => (
                <div key={category} className="skill-category">
                  <h4>{category}</h4>
                  <div className="skill-nodes">
                    {courses.map((course) => (
                      <div key={course.id} className={getStatusClass(course.status)}>
                        <div className="node-icon">
                          {getStatusIcon(course.status)}
                        </div>
                        <div className="node-content">
                          <h5>{course.title}</h5>
                          <div className="node-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${course.progress_percent}%` }}
                              />
                            </div>
                            <span>{course.progress_percent}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="badges-tab">
              <h3>Achievements</h3>
              <div className="badges-grid">
                {badges.map((badge) => (
                  <div key={badge.id} className="badge-card">
                    <div 
                      className="badge-icon"
                      style={{ backgroundColor: badge.badge_color + '20', color: badge.badge_color }}
                    >
                      {badge.badge_icon === 'Award' && <Award size={32} />}
                      {badge.badge_icon === 'Trophy' && <Trophy size={32} />}
                      {badge.badge_icon === 'Flame' && <Flame size={32} />}
                      {badge.badge_icon === 'Star' && <Star size={32} />}
                    </div>
                    <h4>{badge.badge_name}</h4>
                    <p>Earned {new Date(badge.earned_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="certificates-tab">
              <h3>All Certificates</h3>
              <div className="certificates-list">
                {certificates.map((cert) => (
                  <div key={cert.id} className="certificate-showcase">
                    <div className="certificate-image">
                      <img src={cert.thumbnail} alt={cert.course_title} />
                      <div className="certificate-overlay">
                        <Award size={48} />
                      </div>
                    </div>
                    <div className="certificate-details">
                      <h4>{cert.course_title}</h4>
                      <p className="instructor">Instructor: {cert.instructor_name}</p>
                      <p className="date">
                        Completed on {new Date(cert.completion_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="cert-id">ID: {cert.certificate_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
