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
    <footer className="footer-modern">
      <div className="container">
        <div className="footer-content-modern">
          {/* Logo */}
          <div className="footer-brand-modern">
            <Link to="/" className="footer-logo-modern">
              <BookOpen size={32} />
              <span>LearnFlow</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="footer-nav-modern">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="footer-link-modern">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Social Links */}
          <div className="footer-social-modern">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="social-icon-modern"
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <social.icon size={20} />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom-modern">
          <p className="copyright-modern">
            © {currentYear} LearnFlow Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
