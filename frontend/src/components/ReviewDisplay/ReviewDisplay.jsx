import React from 'react';
import './ReviewDisplay.css';

const ReviewDisplay = ({ review, userType }) => {
  if (!review || !review.isReviewCompleted) {
    return null;
  }

  const renderStars = (rating) => {
    return (
      <div className="review-display-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fas fa-star ${star <= rating ? 'filled' : ''}`}
          ></i>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="review-display-container">
      <h3 className="review-display-title">
        <i className="fas fa-star-half-alt"></i> Project Reviews
      </h3>

      {/* Customer's Review (visible to worker) */}
      {userType === 'worker' && review.customerToWorker && review.customerToWorker.rating && (
        <div className="review-display-card">
          <div className="review-display-header">
            <div className="review-display-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="review-display-info">
              <h4>Customer's Review</h4>
              <span className="review-display-date">
                {formatDate(review.customerToWorker.submittedAt)}
              </span>
            </div>
          </div>
          {renderStars(review.customerToWorker.rating)}
          {review.customerToWorker.comment && (
            <p className="review-display-comment">"{review.customerToWorker.comment}"</p>
          )}
        </div>
      )}

      {/* Worker's Review (visible to customer) */}
      {userType === 'customer' && review.workerToCustomer && review.workerToCustomer.rating && (
        <div className="review-display-card">
          <div className="review-display-header">
            <div className="review-display-avatar">
              <i className="fas fa-hard-hat"></i>
            </div>
            <div className="review-display-info">
              <h4>Worker's Review</h4>
              <span className="review-display-date">
                {formatDate(review.workerToCustomer.submittedAt)}
              </span>
            </div>
          </div>
          {renderStars(review.workerToCustomer.rating)}
          {review.workerToCustomer.comment && (
            <p className="review-display-comment">"{review.workerToCustomer.comment}"</p>
          )}
        </div>
      )}

      {/* Both reviews (admin or completed view) */}
      {userType === 'both' && (
        <>
          {review.customerToWorker && review.customerToWorker.rating && (
            <div className="review-display-card">
              <div className="review-display-header">
                <div className="review-display-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="review-display-info">
                  <h4>Customer → Worker</h4>
                  <span className="review-display-date">
                    {formatDate(review.customerToWorker.submittedAt)}
                  </span>
                </div>
              </div>
              {renderStars(review.customerToWorker.rating)}
              {review.customerToWorker.comment && (
                <p className="review-display-comment">"{review.customerToWorker.comment}"</p>
              )}
            </div>
          )}

          {review.workerToCustomer && review.workerToCustomer.rating && (
            <div className="review-display-card">
              <div className="review-display-header">
                <div className="review-display-avatar">
                  <i className="fas fa-hard-hat"></i>
                </div>
                <div className="review-display-info">
                  <h4>Worker → Customer</h4>
                  <span className="review-display-date">
                    {formatDate(review.workerToCustomer.submittedAt)}
                  </span>
                </div>
              </div>
              {renderStars(review.workerToCustomer.rating)}
              {review.workerToCustomer.comment && (
                <p className="review-display-comment">"{review.workerToCustomer.comment}"</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewDisplay;
