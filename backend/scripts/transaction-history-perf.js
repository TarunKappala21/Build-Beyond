const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const { MONGO_URI } = require("../config/constants");
const { Transaction } = require("../models");

const REPORT_DIR = path.join(__dirname, "..", "perf-reports");

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = args[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
      continue;
    }

    out[key] = next;
    i += 1;
  }

  return out;
};

const toObjectId = (value, field) => {
  if (!value) {
    throw new Error(`Missing required argument --${field}`);
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ObjectId for --${field}: ${value}`);
  }

  return new mongoose.Types.ObjectId(value);
};

const ensureReportDir = () => {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
};

const explainSummary = (plan) => {
  const stats = plan.executionStats || {};
  return {
    executionTimeMillis: stats.executionTimeMillis ?? null,
    totalKeysExamined: stats.totalKeysExamined ?? null,
    totalDocsExamined: stats.totalDocsExamined ?? null,
    nReturned: stats.nReturned ?? null,
    scanRatio:
      typeof stats.nReturned === "number" && stats.nReturned > 0
        ? Number((stats.totalDocsExamined / stats.nReturned).toFixed(2))
        : null,
  };
};

const capture = async (options) => {
  const label = options.label || `capture-${Date.now()}`;
  const hasWorkerId = !!options.workerId;
  const hasCompanyId = !!options.companyId;
  const hasCustomerId = !!options.customerId;

  if (!hasWorkerId && !hasCompanyId && !hasCustomerId) {
    throw new Error(
      "Provide at least one of --workerId, --companyId, or --customerId",
    );
  }

  const query = {};
  if (hasWorkerId) {
    query.workerId = toObjectId(options.workerId, "workerId");
  }
  if (hasCompanyId) {
    query.companyId = toObjectId(options.companyId, "companyId");
  }
  if (hasCustomerId) {
    query.customerId = toObjectId(options.customerId, "customerId");
  }
  if (options.status) {
    query.status = options.status;
  }
  if (options.type) {
    query.transactionType = options.type;
  }

  const limit = Number(options.limit || 20);
  const skip = Number(options.skip || 0);

  const findPlan = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean()
    .explain("executionStats");

  const countStart = process.hrtime.bigint();
  const totalCount = await Transaction.countDocuments(query);
  const countEnd = process.hrtime.bigint();
  const countExecutionMs = Number(countEnd - countStart) / 1e6;

  const payload = {
    label,
    capturedAt: new Date().toISOString(),
    query: {
      workerId: query.workerId ? String(query.workerId) : null,
      companyId: query.companyId ? String(query.companyId) : null,
      customerId: query.customerId ? String(query.customerId) : null,
      status: options.status || null,
      type: options.type || null,
      limit,
      skip,
    },
    find: explainSummary(findPlan),
    count: {
      executionTimeMillis: Number(countExecutionMs.toFixed(3)),
      totalKeysExamined: null,
      totalDocsExamined: null,
      nReturned: totalCount,
      scanRatio: null,
    },
  };

  ensureReportDir();

  const outFile = path.join(REPORT_DIR, `transaction-history-${label}.json`);
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));

  console.log("Saved report:", outFile);
  console.log("Find summary:", payload.find);
  console.log("Count summary:", payload.count);
};

const compare = (options) => {
  const beforeLabel = options.before;
  const afterLabel = options.after;

  if (!beforeLabel || !afterLabel) {
    throw new Error(
      "Use --before <label> and --after <label> for compare mode.",
    );
  }

  const beforeFile = path.join(
    REPORT_DIR,
    `transaction-history-${beforeLabel}.json`,
  );
  const afterFile = path.join(
    REPORT_DIR,
    `transaction-history-${afterLabel}.json`,
  );

  if (!fs.existsSync(beforeFile) || !fs.existsSync(afterFile)) {
    throw new Error(
      "One or both report files are missing. Capture both first.",
    );
  }

  const before = JSON.parse(fs.readFileSync(beforeFile, "utf8"));
  const after = JSON.parse(fs.readFileSync(afterFile, "utf8"));

  const pct = (b, a) => {
    if (typeof b !== "number" || typeof a !== "number" || b === 0) {
      return null;
    }
    return Number((((b - a) / b) * 100).toFixed(2));
  };

  const result = {
    query: after.query,
    find: {
      executionTimeMillis: {
        before: before.find.executionTimeMillis,
        after: after.find.executionTimeMillis,
        improvementPct: pct(
          before.find.executionTimeMillis,
          after.find.executionTimeMillis,
        ),
      },
      totalDocsExamined: {
        before: before.find.totalDocsExamined,
        after: after.find.totalDocsExamined,
        improvementPct: pct(
          before.find.totalDocsExamined,
          after.find.totalDocsExamined,
        ),
      },
      totalKeysExamined: {
        before: before.find.totalKeysExamined,
        after: after.find.totalKeysExamined,
        improvementPct: pct(
          before.find.totalKeysExamined,
          after.find.totalKeysExamined,
        ),
      },
      scanRatio: {
        before: before.find.scanRatio,
        after: after.find.scanRatio,
        improvementPct: pct(before.find.scanRatio, after.find.scanRatio),
      },
    },
    count: {
      executionTimeMillis: {
        before: before.count.executionTimeMillis,
        after: after.count.executionTimeMillis,
        improvementPct: pct(
          before.count.executionTimeMillis,
          after.count.executionTimeMillis,
        ),
      },
      totalDocsExamined: {
        before: before.count.totalDocsExamined,
        after: after.count.totalDocsExamined,
        improvementPct: pct(
          before.count.totalDocsExamined,
          after.count.totalDocsExamined,
        ),
      },
    },
  };

  const compareFile = path.join(
    REPORT_DIR,
    `transaction-history-compare-${beforeLabel}-vs-${afterLabel}.json`,
  );
  fs.writeFileSync(compareFile, JSON.stringify(result, null, 2));

  console.log("Saved comparison:", compareFile);
  console.log(JSON.stringify(result, null, 2));
};

const main = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined.");
  }

  const options = parseArgs();
  const mode = options.mode || "capture";

  if (!["capture", "compare"].includes(mode)) {
    throw new Error("Invalid --mode. Use capture or compare.");
  }

  if (mode === "compare") {
    compare(options);
    return;
  }

  await mongoose.connect(MONGO_URI, {});
  try {
    await capture(options);
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error("transaction-history-perf failed:", error.message);
  process.exit(1);
});
