// Migration script to undo: Remove needsRevision and customerFeedback fields from existing milestones
const mongoose = require('mongoose');

// Import your models
const { ConstructionProjectSchema } = require('../models/index');
const { MONGO_URI } = require('../config/constants');

async function undoMilestoneFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {});

    console.log('Connected to MongoDB');

    // Find all construction projects with milestones
    const projects = await ConstructionProjectSchema.find({ 'milestones.0': { $exists: true } });

    console.log(`Found ${projects.length} projects with milestones`);

    let updatedCount = 0;

    // Update each project's milestones - remove the new fields
    for (const project of projects) {
      let modified = false;

      project.milestones = project.milestones.map(milestone => {
        // Remove the fields
        if (milestone.needsRevision !== undefined) {
          milestone.needsRevision = undefined;
          modified = true;
        }
        if (milestone.customerFeedback !== undefined) {
          milestone.customerFeedback = undefined;
          modified = true;
        }
        if (milestone.feedbackAt !== undefined) {
          milestone.feedbackAt = undefined;
          modified = true;
        }
        return milestone;
      });

      if (modified) {
        await project.save();
        updatedCount++;
        console.log(`✓ Updated project: ${project.projectName} (${project._id})`);
      }
    }

    console.log(`\n✅ Undo completed successfully!`);
    console.log(`   - Total projects found: ${projects.length}`);
    console.log(`   - Projects updated: ${updatedCount}`);

  } catch (error) {
    console.error('❌ Undo failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the undo
undoMilestoneFields();
