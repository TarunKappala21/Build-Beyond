import React, { useState } from 'react';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, onSubmit, projectName, reviewType }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment });
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2>Rate & Review</h2>
          <button className="review-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="review-modal-body">
          <p className="review-project-name">
            <strong>Project:</strong> {projectName}
          </p>
          <p className="review-subtitle">
            How was your experience working {reviewType === 'customer' ? 'with this worker' : 'with this customer'}?
          </p>

          <form onSubmit={handleSubmit}>
            <div className="review-rating-section">
              <label>Your Rating *</label>
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`fas fa-star ${
                      star <= (hoveredRating || rating) ? 'active' : ''
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  ></i>
                ))}
              </div>
              <span className="review-rating-text">
                {rating === 0 && 'Select a rating'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            </div>

            <div className="review-comment-section">
              <label>Your Review (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience working on this project..."
                rows="5"
                maxLength="500"
              />
              <span className="review-char-count">{comment.length}/500</span>
            </div>

            <div className="review-modal-actions">
              <button
                type="button"
                className="review-btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="review-btn-submit"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
