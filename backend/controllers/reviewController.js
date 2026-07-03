const { Customer, Worker, ArchitectHiring, DesignRequest } = require('../models');

// Customer submits review for worker
const submitCustomerReview = async (req, res) => {
  try {
    const { projectId, projectType, rating, comment } = req.body;
    const customerId = req.user.user_id;

    if (!projectId || !projectType || !rating) {
      return res.status(400).json({ error: 'Project ID, project type, and rating are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    let project;
    if (projectType === 'architect') {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === 'interior') {
      project = await DesignRequest.findById(projectId);
    } else {
      return res.status(400).json({ error: 'Invalid project type.' });
    }

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (project.customerId.toString() !== customerId) {
      return res.status(403).json({ error: 'Unauthorized to review this project.' });
    }

    // Check if all milestones are at 100%
    if (!project.milestones || project.milestones.length === 0) {
      return res.status(400).json({ error: 'Project has no milestones defined yet.' });
    }
    
    const totalProgress = project.milestones.reduce((sum, m) => m.status === 'Approved' ? sum + m.percentage : sum, 0);
    if (totalProgress < 100) {
      return res.status(400).json({ error: 'Cannot submit review until project is 100% complete.' });
    }

    // Check if customer already reviewed
    if (project.review && project.review.customerToWorker && project.review.customerToWorker.rating) {
      return res.status(400).json({ error: 'You have already submitted a review for this project.' });
    }

    // Get customer and worker details
    const customer = await Customer.findById(customerId);
    const worker = await Worker.findById(project.workerId);

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found.' });
    }

    // Save review in project
    if (!project.review) {
      project.review = {};
    }
    project.review.customerToWorker = {
      rating: rating,
      comment: comment || '',
      submittedAt: new Date()
    };

    // Check if both reviews are done
    if (project.review.workerToCustomer && project.review.workerToCustomer.rating) {
      project.review.isReviewCompleted = true;
      project.status = 'Completed';
    }

    await project.save();

    // Add review to worker's profile
    worker.reviews.push({
      projectId: project._id,
      projectName: project.projectName,
      projectType: projectType,
      customerId: customerId,
      customerName: customer.name,
      rating: rating,
      comment: comment || '',
      reviewedAt: new Date()
    });

    // Recalculate worker's average rating
    worker.totalReviews = worker.reviews.length;
    const totalRating = worker.reviews.reduce((sum, review) => sum + review.rating, 0);
    worker.rating = totalRating / worker.totalReviews;

    await worker.save();

    res.status(200).json({ 
      message: 'Review submitted successfully.', 
      project: project,
      isProjectCompleted: project.review.isReviewCompleted 
    });
  } catch (error) {
    console.error('Error submitting customer review:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error while submitting review.', details: error.message });
  }
};

// Worker submits review for customer
const submitWorkerReview = async (req, res) => {
  try {
    const { projectId, projectType, rating, comment } = req.body;
    const workerId = req.user.user_id;

    if (!projectId || !projectType || !rating) {
      return res.status(400).json({ error: 'Project ID, project type, and rating are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    let project;
    if (projectType === 'architect') {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === 'interior') {
      project = await DesignRequest.findById(projectId);
    } else {
      return res.status(400).json({ error: 'Invalid project type.' });
    }

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (project.workerId.toString() !== workerId) {
      return res.status(403).json({ error: 'Unauthorized to review this project.' });
    }

    // Check if all milestones are at 100%
    if (!project.milestones || project.milestones.length === 0) {
      return res.status(400).json({ error: 'Project has no milestones defined yet.' });
    }
    
    const totalProgress = project.milestones.reduce((sum, m) => m.status === 'Approved' ? sum + m.percentage : sum, 0);
    if (totalProgress < 100) {
      return res.status(400).json({ error: 'Cannot submit review until project is 100% complete.' });
    }

    // Check if worker already reviewed
    if (project.review && project.review.workerToCustomer && project.review.workerToCustomer.rating) {
      return res.status(400).json({ error: 'You have already submitted a review for this project.' });
    }

    // Get customer and worker details
    const worker = await Worker.findById(workerId);
    const customer = await Customer.findById(project.customerId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Save review in project
    if (!project.review) {
      project.review = {};
    }
    project.review.workerToCustomer = {
      rating: rating,
      comment: comment || '',
      submittedAt: new Date()
    };

    // Check if both reviews are done
    if (project.review.customerToWorker && project.review.customerToWorker.rating) {
      project.review.isReviewCompleted = true;
      project.status = 'Completed';
    }

    await project.save();

    // Add review to customer's profile
    customer.reviews.push({
      projectId: project._id,
      projectName: project.projectName,
      projectType: projectType,
      workerId: workerId,
      workerName: worker.name,
      rating: rating,
      comment: comment || '',
      reviewedAt: new Date()
    });

    // Recalculate customer's average rating
    customer.totalReviews = customer.reviews.length;
    const totalRating = customer.reviews.reduce((sum, review) => sum + review.rating, 0);
    customer.rating = totalRating / customer.totalReviews;

    await customer.save();

    res.status(200).json({ 
      message: 'Review submitted successfully.', 
      project: project,
      isProjectCompleted: project.review.isReviewCompleted 
    });
  } catch (error) {
    console.error('Error submitting worker review:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error while submitting review.', details: error.message });
  }
};

// Get project review status
const getProjectReviewStatus = async (req, res) => {
  try {
    const { projectId, projectType } = req.params;

    let project;
    if (projectType === 'architect') {
      project = await ArchitectHiring.findById(projectId);
    } else if (projectType === 'interior') {
      project = await DesignRequest.findById(projectId);
    } else {
      return res.status(400).json({ error: 'Invalid project type.' });
    }

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Calculate progress
    const totalProgress = project.milestones.reduce((sum, m) => m.status === 'Approved' ? sum + m.percentage : sum, 0);

    res.status(200).json({
      projectId: project._id,
      projectName: project.projectName,
      totalProgress: totalProgress,
      isEligibleForReview: totalProgress >= 100,
      review: project.review || {},
      customerReviewSubmitted: !!(project.review && project.review.customerToWorker && project.review.customerToWorker.rating),
      workerReviewSubmitted: !!(project.review && project.review.workerToCustomer && project.review.workerToCustomer.rating),
      isReviewCompleted: !!(project.review && project.review.isReviewCompleted),
      status: project.status
    });
  } catch (error) {
    console.error('Error getting review status:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  submitCustomerReview,
  submitWorkerReview,
  getProjectReviewStatus
};
