import { useState, useEffect } from 'react'
import api from '../services/api'
import { Star, User, Loader2 } from 'lucide-react'
import './CourseReviews.css'

const CourseReviews = ({ courseId, isEnrolled }) => {
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [userReview, setUserReview] = useState(null)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReviews()
    checkUserReview()
  }, [courseId])

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/course/${courseId}`)
      setReviews(response.data.reviews)
      setAverageRating(response.data.averageRating)
      setTotalReviews(response.data.totalReviews)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserReview = async () => {
    try {
      const response = await api.get(`/reviews/check/${courseId}`)
      if (response.data.hasReviewed) {
        setUserReview(response.data.review)
        setRating(response.data.review.rating)
        setReviewText(response.data.review.review)
      }
    } catch (error) {
      console.error('Failed to check review:', error)
    }
  }

  const submitReview = async () => {
    if (!rating) return
    
    setSubmitting(true)
    try {
      await api.post('/reviews', {
        courseId,
        rating,
        review: reviewText
      })
      setShowForm(false)
      fetchReviews()
      checkUserReview()
    } catch (error) {
      alert('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (count, interactive = false) => {
    return (
      <div className={`stars ${interactive ? 'interactive' : ''}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={star <= count ? 'filled' : ''}
            onClick={() => interactive && setRating(star)}
            disabled={!interactive}
          >
            <Star size={20} fill={star <= count ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="course-reviews loading">
        <Loader2 className="spin" size={24} />
      </div>
    )
  }

  return (
    <div className="course-reviews">
      <div className="reviews-header">
        <h3>Student Reviews</h3>
        <div className="rating-summary">
          <div className="average-rating">
            <span className="rating-number">{averageRating}</span>
            {renderStars(Math.round(averageRating))}
          </div>
          <span className="total-reviews">{totalReviews} reviews</span>
        </div>
      </div>

      {isEnrolled && (
        <div className="review-form-section">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-outline"
            >
              {userReview ? 'Edit Your Review' : 'Write a Review'}
            </button>
          ) : (
            <div className="review-form">
              <h4>{userReview ? 'Edit Review' : 'Write a Review'}</h4>
              <div className="rating-input">
                <label>Your Rating</label>
                {renderStars(rating, true)}
              </div>
              <div className="review-input">
                <label>Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this course..."
                  rows={4}
                />
              </div>
              <div className="form-actions">
                <button
                  onClick={() => setShowForm(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  disabled={submitting || !rating}
                  className="btn btn-primary"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="spin" size={16} />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="reviewer">
                  <div className="avatar">
                    <User size={20} />
                  </div>
                  <span className="name">{review.user_name}</span>
                </div>
                <span className="date">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="review-rating">
                {renderStars(review.rating)}
              </div>
              {review.review && (
                <p className="review-text">{review.review}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CourseReviews
