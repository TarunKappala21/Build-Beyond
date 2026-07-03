// Migration to fix payment structure for existing projects
const mongoose = require('mongoose');
const { ArchitectHiring, DesignRequest } = require('../models/index');

async function fixExistingProjectPayments() {
  try {
    console.log('Starting migration to fix existing project payments...');
    
    // Fix Architect Hiring projects - check all accepted or pending payment projects
    const architectProjects = await ArchitectHiring.find({
      $or: [
        { status: 'Accepted' },
        { status: 'Pending Payment' }
      ],
      'paymentDetails.milestonePayments': { $exists: true }
    });
    
    console.log(`Found ${architectProjects.length} architect projects to check`);
    
    for (const project of architectProjects) {
      console.log(`Checking architect project ${project._id}, status: ${project.status}`);
      
      if (project.paymentDetails && project.paymentDetails.milestonePayments) {
        const firstMilestone = project.paymentDetails.milestonePayments[0];
        
        console.log(`First milestone:`, {
          percentage: firstMilestone?.percentage,
          paymentCollected: firstMilestone?.paymentCollected,
          status: firstMilestone?.status
        });
        
        // If first milestone exists but paymentCollected is not set, mark it as collected
        if (firstMilestone && firstMilestone.percentage === 25) {
          if (!firstMilestone.paymentCollected) {
            console.log(`Fixing architect project ${project._id} - marking first milestone as paid`);
            firstMilestone.paymentCollected = true;
            firstMilestone.paymentCollectedAt = project.paymentDetails.paymentInitiatedAt || new Date();
            await project.save();
            console.log(`Fixed successfully!`);
          } else {
            console.log(`First milestone already marked as paid`);
          }
        }
      }
    }
    
    // Fix Interior Design projects
    const interiorProjects = await DesignRequest.find({
      $or: [
        { status: 'accepted' },
        { status: 'pending payment' }
      ],
      'paymentDetails.milestonePayments': { $exists: true }
    });
    
    console.log(`Found ${interiorProjects.length} interior projects to check`);
    
    for (const project of interiorProjects) {
      console.log(`Checking interior project ${project._id}, status: ${project.status}`);
      
      if (project.paymentDetails && project.paymentDetails.milestonePayments) {
        const firstMilestone = project.paymentDetails.milestonePayments[0];
        
        console.log(`First milestone:`, {
          percentage: firstMilestone?.percentage,
          paymentCollected: firstMilestone?.paymentCollected,
          status: firstMilestone?.status
        });
        
        // If first milestone exists but paymentCollected is not set, mark it as collected
        if (firstMilestone && firstMilestone.percentage === 25) {
          if (!firstMilestone.paymentCollected) {
            console.log(`Fixing interior project ${project._id} - marking first milestone as paid`);
            firstMilestone.paymentCollected = true;
            firstMilestone.paymentCollectedAt = project.paymentDetails.paymentInitiatedAt || new Date();
            await project.save();
            console.log(`Fixed successfully!`);
          } else {
            console.log(`First milestone already marked as paid`);
          }
        }
      }
    }
    
    console.log('Migration completed successfully!');
    return {
      success: true,
      message: `Fixed ${architectProjects.length + interiorProjects.length} projects`
    };
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

module.exports = { fixExistingProjectPayments };

// Run if called directly
if (require.main === module) {
  const { MONGO_URI } = require('../config/constants');
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      return fixExistingProjectPayments();
    })
    .then(() => {
      console.log('Done! Closing connection...');
      return mongoose.connection.close();
    })
    .then(() => {
      console.log('Connection closed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
