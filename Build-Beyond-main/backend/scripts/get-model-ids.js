const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const { MONGO_URI } = require("../config/constants");
const {
  Company,
  Worker,
  Customer,
  ConstructionProjectSchema,
  Transaction,
} = require("../models");

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};

  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    if (!current.startsWith("--")) continue;

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

const toObjectId = (value) => {
  if (!value) return null;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const printHeader = (title) => {
  console.log(`\n=== ${title} ===`);
};

const main = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined.");
  }

  const options = parseArgs();
  const limit = Number(options.limit || 10);
  const companyId = toObjectId(options.companyId);
  const workerId = toObjectId(options.workerId);

  await mongoose.connect(MONGO_URI, {});

  try {
    printHeader("Company IDs");
    const companies = await Company.find({})
      .select("_id companyName email createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    console.table(
      companies.map((c) => ({
        _id: String(c._id),
        companyName: c.companyName,
        email: c.email,
        createdAt: c.createdAt,
      })),
    );

    printHeader("Worker IDs");
    const workers = await Worker.find({})
      .select("_id name email createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    console.table(
      workers.map((w) => ({
        _id: String(w._id),
        name: w.name,
        email: w.email,
        createdAt: w.createdAt,
      })),
    );

    printHeader("Customer IDs");
    const customers = await Customer.find({})
      .select("_id name email createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    console.table(
      customers.map((c) => ({
        _id: String(c._id),
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
      })),
    );

    printHeader("Construction Project IDs");
    const projects = await ConstructionProjectSchema.find({})
      .select("_id projectName companyId customerId status createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    console.table(
      projects.map((p) => ({
        _id: String(p._id),
        projectName: p.projectName,
        companyId: p.companyId ? String(p.companyId) : "",
        customerId: p.customerId ? String(p.customerId) : "",
        status: p.status,
        createdAt: p.createdAt,
      })),
    );

    const txFilter = {};
    if (companyId) txFilter.companyId = companyId;
    if (workerId) txFilter.workerId = workerId;

    printHeader("Transaction IDs and filters");
    const transactions = await Transaction.find(txFilter)
      .select(
        "_id companyId workerId customerId projectId status transactionType amount createdAt",
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    console.table(
      transactions.map((t) => ({
        _id: String(t._id),
        companyId: t.companyId ? String(t.companyId) : "",
        workerId: t.workerId ? String(t.workerId) : "",
        customerId: t.customerId ? String(t.customerId) : "",
        projectId: t.projectId ? String(t.projectId) : "",
        status: t.status,
        transactionType: t.transactionType,
        amount: t.amount,
        createdAt: t.createdAt,
      })),
    );

    printHeader("Transaction status counts");
    const statusCounts = await Transaction.aggregate([
      { $match: txFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    console.table(statusCounts.map((s) => ({ status: s._id, count: s.count })));

    printHeader("Transaction type counts");
    const typeCounts = await Transaction.aggregate([
      { $match: txFilter },
      { $group: { _id: "$transactionType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    console.table(
      typeCounts.map((t) => ({ transactionType: t._id, count: t.count })),
    );

    console.log(
      "\nTip: run with --companyId <id> to get company-specific transaction filters.",
    );
    console.log(
      "Tip: run with --workerId <id> to get worker-specific transaction filters.",
    );
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error("get-model-ids failed:", error.message);
  process.exit(1);
});
