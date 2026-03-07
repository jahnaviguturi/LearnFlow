import { Link } from 'react-router-dom'
import { BookOpen, Linkedin, Github, Twitter } from 'lucide-react'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/courses', label: 'Courses' },
    { to: '/my-courses', label: 'Dashboard' },
    { to: '#', label: 'Contact' }
  ]

  const socialLinks = [
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' }
  ]

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Logo and Description */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <BookOpen size={28} />
              <span>LearnFlow</span>
            </Link>
            <p className="footer-description">
              Empowering learners worldwide with quality education and interactive courses.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="footer-nav">
            <h4>Quick Links</h4>
            <ul>
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="footer-social">
            <h4>Connect With Us</h4>
            <div className="social-icons">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="social-icon"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p className="copyright">
            © {currentYear} LearnFlow Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
