const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { MONGO_URI } = require('../config/constants');
const models = require('../models');

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const isFullSync = args.has('--full-sync');

const run = async () => {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not defined.');
  }

  await mongoose.connect(MONGO_URI, {});
  console.log('Connected to MongoDB');

  const modelEntries = Object.entries(models).filter(([, value]) => value && typeof value.syncIndexes === 'function');

  if (isDryRun) {
    console.log('Mode: dry-run (no changes will be applied)');
  } else if (isFullSync) {
    console.log('Mode: full-sync (can drop unmanaged indexes)');
  } else {
    console.log('Mode: safe-create (creates missing indexes only)');
  }

  for (const [name, model] of modelEntries) {
    if (isDryRun) {
      const diff = await model.diffIndexes();
      console.log(`${name} diff:`, diff);
      continue;
    }

    if (isFullSync) {
      console.log(`Syncing indexes for ${name}...`);
      const result = await model.syncIndexes();
      console.log(`Done ${name}:`, result);
      continue;
    }

    console.log(`Creating missing indexes for ${name}...`);
    await model.createIndexes();
    console.log(`Done ${name}`);
  }

  await mongoose.disconnect();
  console.log('Index sync completed.');
};

run().catch(async (error) => {
  console.error('Index sync failed:', error);
  try {
    await mongoose.disconnect();
  } catch (_err) {
    // ignore disconnect errors
  }
  process.exit(1);
});
