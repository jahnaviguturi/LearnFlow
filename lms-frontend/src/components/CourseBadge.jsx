import { useState, useRef } from 'react'
import { Award, Download, Share2, X } from 'lucide-react'
import './CourseBadge.css'

const CourseBadge = ({ course, user, completionDate, onClose }) => {
  const badgeRef = useRef(null)
  const [showModal, setShowModal] = useState(true)

  const downloadBadge = async () => {
    if (!badgeRef.current) return
    
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(badgeRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true
    })
    
    const link = document.createElement('a')
    link.download = `certificate-${course.title.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const shareBadge = async () => {
    const text = `I just completed "${course.title}" on LearnFlow! 🎓`
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Course Completion',
          text: text,
          url: url
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`)
      alert('Copied to clipboard!')
    }
  }

  const handleClose = () => {
    setShowModal(false)
    onClose?.()
  }

  if (!showModal) return null

  return (
    <div className="badge-modal" onClick={handleClose}>
      <div className="badge-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={handleClose}>
          <X size={24} />
        </button>
        
        <div ref={badgeRef} className="certificate">
          <div className="certificate-header">
            <div className="logo">LearnFlow</div>
            <h1>Certificate of Completion</h1>
          </div>
          
          <div className="certificate-body">
            <p className="presented-to">This certifies that</p>
            <h2 className="student-name">{user?.name}</h2>
            <p className="has-completed">has successfully completed</p>
            <h3 className="course-name">{course.title}</h3>
            <p className="instructor">Instructor: {course.instructor_name}</p>
          </div>
          
          <div className="certificate-footer">
            <div className="date">
              <span>Completed on</span>
              <strong>{new Date(completionDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</strong>
            </div>
            <div className="verification">
              <span>Certificate ID</span>
              <strong>{`LF-${Date.now().toString(36).toUpperCase()}`}</strong>
            </div>
          </div>
          
          <div className="certificate-seal">
            <Award size={80} />
          </div>
          
          <div className="watermark">LearnFlow</div>
        </div>

        <div className="badge-actions">
          <button onClick={downloadBadge} className="btn btn-primary">
            <Download size={18} /> Download Certificate
          </button>
          <button onClick={shareBadge} className="btn btn-outline">
            <Share2 size={18} /> Share
          </button>
        </div>
      </div>
    </div>
  )
}

export default CourseBadge
