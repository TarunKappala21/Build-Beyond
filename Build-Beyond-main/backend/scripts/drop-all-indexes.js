const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const { MONGO_URI } = require("../config/constants");
const models = require("../models");

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");

const run = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined.");
  }

  await mongoose.connect(MONGO_URI, {});
  console.log("Connected to MongoDB");

  const modelEntries = Object.entries(models).filter(
    ([, value]) =>
      value &&
      value.collection &&
      typeof value.collection.dropIndexes === "function",
  );

  for (const [name, model] of modelEntries) {
    try {
      const existingIndexes = await model.collection.indexes();
      const secondaryIndexes = existingIndexes
        .map((index) => index.name)
        .filter((indexName) => indexName !== "_id_");

      console.log(`${name} indexes found:`, secondaryIndexes);

      if (isDryRun) {
        continue;
      }

      if (secondaryIndexes.length === 0) {
        console.log(`No secondary indexes to drop for ${name}.`);
        continue;
      }

      console.log(`Dropping all secondary indexes for ${name}...`);
      await model.collection.dropIndexes();
      console.log(`Dropped indexes for ${name}.`);
    } catch (error) {
      if (
        error &&
        (error.codeName === "NamespaceNotFound" || error.code === 26)
      ) {
        console.log(`Skipping ${name}: collection does not exist yet.`);
        continue;
      }

      throw error;
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
};

run().catch(async (error) => {
  console.error("Drop all indexes failed:", error);
  try {
    await mongoose.disconnect();
  } catch (_err) {
    // ignore disconnect errors
  }
  process.exit(1);
});
