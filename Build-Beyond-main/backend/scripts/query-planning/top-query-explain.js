const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const { MONGO_URI } = require("../../config/constants");
const {
  Customer,
  Company,
  Worker,
  ArchitectHiring,
  ConstructionProjectSchema,
  DesignRequest,
  Bid,
  WorkerToCompany,
  Transaction,
} = require("../../models");

const REPORT_DIR = path.join(
  __dirname,
  "..",
  "..",
  "perf-reports",
  "query-planning",
);

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

const toObjectId = (value, fieldName) => {
  if (!value) {
    throw new Error(`Missing required argument --${fieldName}`);
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ObjectId for --${fieldName}: ${value}`);
  }

  return new mongoose.Types.ObjectId(value);
};

const safeNumber = (value) =>
  Number.isFinite(value) ? Number(value.toFixed(3)) : null;

const extractExecutionStats = (explainResult) => {
  const executionStats = explainResult?.executionStats || {};
  const totalDocsExamined = executionStats.totalDocsExamined ?? null;
  const nReturned = executionStats.nReturned ?? null;

  return {
    executionTimeMillis: executionStats.executionTimeMillis ?? null,
    totalKeysExamined: executionStats.totalKeysExamined ?? null,
    totalDocsExamined,
    nReturned,
    scanRatio:
      typeof totalDocsExamined === "number" &&
      typeof nReturned === "number" &&
      nReturned > 0
        ? safeNumber(totalDocsExamined / nReturned)
        : null,
    winningPlanStage: explainResult?.queryPlanner?.winningPlan?.stage || null,
  };
};

const buildMixedQuerySet = (context) => {
  const companyId = context.companyId;
  const workerId = context.workerId;
  const customerId = context.customerId;

  return [
    {
      key: "admin_dashboard_customers",
      label: "GET /admindashboard customers",
      collection: Customer,
      route: "/admindashboard",
      query: {},
      sort: { createdAt: -1 },
      limit: 50,
      fields: "name email createdAt",
      notes: "Admin dashboard customer list",
    },
    {
      key: "admin_dashboard_companies",
      label: "GET /admindashboard companies",
      collection: Company,
      route: "/admindashboard",
      query: {},
      sort: { createdAt: -1 },
      limit: 50,
      fields: "companyName email createdAt",
      notes: "Admin dashboard company list",
    },
    {
      key: "admin_dashboard_workers",
      label: "GET /admindashboard workers",
      collection: Worker,
      route: "/admindashboard",
      query: {},
      sort: { createdAt: -1 },
      limit: 50,
      fields: "name email specialization createdAt",
      notes: "Admin dashboard worker list",
    },
    {
      key: "admin_analytics_workers_month",
      label: "GET /admin/analytics workers (timeFilter=month)",
      collection: Worker,
      route: "/admin/analytics?timeFilter=month",
      query: {},
      sort: { createdAt: -1 },
      limit: 50,
      fields: "name specialization rating profileImage earnings createdAt",
      notes: "Analytics worker summary source",
    },
    {
      key: "admin_analytics_companies_month",
      label: "GET /admin/analytics companies (timeFilter=month)",
      collection: Company,
      route: "/admin/analytics?timeFilter=month",
      query: {},
      sort: { createdAt: -1 },
      limit: 50,
      fields: "companyName status projectsCompleted createdAt",
      notes: "Analytics company summary source",
    },
    {
      key: "company_dashboard_projects",
      label: "GET /companydashboard projects",
      collection: ConstructionProjectSchema,
      route: "/companydashboard",
      requires: ["companyId"],
      query: { companyId },
      sort: { createdAt: -1 },
      limit: 20,
      fields: "projectName status companyId createdAt",
      notes: "Company dashboard projects",
    },
    {
      key: "company_ongoing_projects",
      label: "GET /companyongoing_projects accepted projects",
      collection: ConstructionProjectSchema,
      route: "/companyongoing_projects",
      requires: ["companyId"],
      query: { companyId, status: "accepted" },
      sort: { createdAt: -1 },
      limit: 50,
      fields: "projectName status companyId createdAt updatedAt",
      notes: "Company ongoing projects",
    },
    {
      key: "company_project_requests",
      label: "GET /project_requests pending/proposal_sent",
      collection: ConstructionProjectSchema,
      route: "/project_requests",
      requires: ["companyId"],
      query: { companyId, status: { $in: ["pending", "proposal_sent"] } },
      sort: { createdAt: -1 },
      limit: 50,
      fields: "projectName status companyId createdAt",
      notes: "Company project requests",
    },
    {
      key: "worker_transactions",
      label: "GET /worker/transactions",
      collection: Transaction,
      route: "/worker/transactions",
      requires: ["workerId"],
      query: {
        workerId,
        status: "completed",
        transactionType: "milestone_release",
      },
      sort: { createdAt: -1 },
      limit: 20,
      fields: "transactionType status amount createdAt workerId",
      notes: "Transaction history benchmark",
    },
    {
      key: "company_bids_open",
      label: "GET /companybids open bids",
      collection: Bid,
      route: "/companybids",
      query: { status: "open" },
      sort: { createdAt: -1 },
      limit: 20,
      fields: "projectName status customerId createdAt",
      notes: "Open bids visible on company dashboard",
    },
    {
      key: "company_to_worker_requests",
      label: "GET /my-employees / worker requests",
      collection: WorkerToCompany,
      route: "/my-employees",
      requires: ["companyId"],
      query: { companyId },
      sort: { createdAt: -1 },
      limit: 20,
      fields: "workerId companyId status createdAt",
      notes: "Company employee requests",
    },
  ];
};

const buildHeavyQuerySet = (context) => {
  const companyId = context.companyId;
  const workerId = context.workerId;
  const customerId = context.customerId;

  return [
    {
      key: "heavy_company_ongoing_projects",
      label: "GET /companyongoing_projects accepted projects",
      collection: ConstructionProjectSchema,
      route: "/companyongoing_projects",
      requires: ["companyId"],
      query: { companyId, status: "accepted" },
      sort: { createdAt: -1 },
      limit: 200,
      fields: "projectName status companyId createdAt updatedAt",
      notes: "Uses companyId+status+createdAt compound index",
    },
    {
      key: "heavy_company_project_requests",
      label: "GET /project_requests pending/proposal_sent",
      collection: ConstructionProjectSchema,
      route: "/project_requests",
      requires: ["companyId"],
      query: { companyId, status: { $in: ["pending", "proposal_sent"] } },
      sort: { createdAt: -1 },
      limit: 200,
      fields: "projectName status companyId createdAt",
      notes: "Uses companyId+status+createdAt compound index",
    },
    {
      key: "heavy_company_dashboard_projects",
      label: "GET /companydashboard projects",
      collection: ConstructionProjectSchema,
      route: "/companydashboard",
      requires: ["companyId"],
      query: { companyId },
      sort: { createdAt: -1 },
      limit: 200,
      fields: "projectName status companyId createdAt",
      notes: "Uses companyId+createdAt index",
    },
    {
      key: "heavy_worker_transactions",
      label: "GET /worker/transactions completed milestone_release",
      collection: Transaction,
      route: "/worker/transactions",
      requires: ["workerId"],
      query: {
        workerId,
        status: "completed",
        transactionType: "milestone_release",
      },
      sort: { createdAt: -1 },
      limit: 200,
      fields: "transactionType status amount createdAt workerId",
      notes: "Uses workerId+status+transactionType+createdAt compound index",
    },
    {
      key: "heavy_worker_transactions_all",
      label: "GET /worker/transactions all",
      collection: Transaction,
      route: "/worker/transactions",
      requires: ["workerId"],
      query: { workerId },
      sort: { createdAt: -1 },
      limit: 200,
      fields: "transactionType status amount createdAt workerId",
      notes: "Uses workerId+createdAt index",
    },
    {
      key: "heavy_company_bids_open",
      label: "GET /companybids open bids excluding company",
      collection: Bid,
      route: "/companybids",
      requires: ["companyId"],
      query: { "companyBids.companyId": { $ne: companyId }, status: "open" },
      sort: { createdAt: -1 },
      limit: 200,
      fields: "projectName status customerId createdAt companyBids",
      notes: "Uses status+createdAt index and array field filtering",
    },
    {
      key: "heavy_company_bids_with_company",
      label: "GET /companybids bids for company",
      collection: Bid,
      route: "/companybids",
      requires: ["companyId"],
      query: { "companyBids.companyId": companyId },
      sort: { createdAt: -1 },
      limit: 200,
      fields: "projectName status customerId createdAt companyBids",
      notes: "Uses companyBids.companyId index",
    },
    {
      key: "heavy_company_worker_requests",
      label: "GET /my-employees worker requests accepted",
      collection: WorkerToCompany,
      route: "/my-employees",
      requires: ["companyId"],
      query: { companyId, status: "accepted" },
      sort: { createdAt: -1 },
      limit: 200,
      fields: "workerId companyId status createdAt",
      notes: "Uses companyId+status+createdAt index",
    },
    {
      key: "heavy_customer_construction_projects",
      label: "GET /admin/customer/:id construction projects",
      collection: ConstructionProjectSchema,
      route: "/admin/customer/:id",
      requires: ["customerId"],
      query: { customerId },
      sort: { createdAt: -1 },
      limit: 200,
      fields: "projectName status customerId companyId createdAt",
      notes: "Uses customerId+createdAt index",
    },
    {
      key: "heavy_customer_architect_hirings",
      label: "GET /admin/customer/:id architect hirings",
      collection: ArchitectHiring,
      route: "/admin/customer/:id",
      requires: ["customerId"],
      query: { customer: customerId },
      sort: { createdAt: -1 },
      limit: 200,
      fields: "projectName customer worker status createdAt",
      notes: "Uses customer+createdAt index",
    },
  ];
};

const explainQuery = async (entry) => {
  const cursor = entry.collection
    .find(entry.query)
    .select(entry.fields)
    .sort(entry.sort)
    .limit(entry.limit)
    .lean();

  const explainResult = await cursor.explain("executionStats");
  const stats = extractExecutionStats(explainResult);

  return {
    key: entry.key,
    label: entry.label,
    route: entry.route,
    collection: entry.collection.modelName,
    query: entry.query,
    sort: entry.sort,
    limit: entry.limit,
    fields: entry.fields,
    notes: entry.notes,
    ...stats,
  };
};

const renderMarkdownTable = (rows) => {
  const header = [
    "Query",
    "Route",
    "Docs Examined",
    "Returned",
    "Execution Time (ms)",
    "Scan Ratio",
    "Winning Plan",
  ];
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.label} | ${row.route} | ${row.totalDocsExamined ?? "n/a"} | ${row.nReturned ?? "n/a"} | ${row.executionTimeMillis ?? "n/a"} | ${row.scanRatio ?? "n/a"} | ${row.winningPlanStage ?? "n/a"} |`,
    );
  }

  return lines.join("\n");
};

const run = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined.");
  }

  const args = parseArgs();
  const companyId = args.companyId
    ? toObjectId(args.companyId, "companyId")
    : null;
  const workerId = args.workerId ? toObjectId(args.workerId, "workerId") : null;
  const customerId = args.customerId
    ? toObjectId(args.customerId, "customerId")
    : null;
  const label = args.label || "query-planning";
  const profile = args.profile || "mixed";

  await mongoose.connect(MONGO_URI, {});
  try {
    const queryBuilder =
      profile === "heavy" ? buildHeavyQuerySet : buildMixedQuerySet;
    const querySet = queryBuilder({ companyId, workerId, customerId }).slice(
      0,
      10,
    );
    const results = [];
    const skipped = [];

    for (const entry of querySet) {
      if (Array.isArray(entry.requires)) {
        const missingRequirements = entry.requires.filter((requirement) => {
          if (requirement === "companyId") return !companyId;
          if (requirement === "workerId") return !workerId;
          if (requirement === "customerId") return !customerId;
          return false;
        });

        if (missingRequirements.length > 0) {
          skipped.push({
            key: entry.key,
            label: entry.label,
            route: entry.route,
            missingRequirements,
          });
          continue;
        }
      }

      const result = await explainQuery(entry);
      results.push(result);
    }

    const report = {
      label,
      profile,
      capturedAt: new Date().toISOString(),
      queryCount: results.length,
      skippedCount: skipped.length,
      skipped,
      queries: results,
      summary: {
        totalDocsExamined: results.reduce(
          (sum, row) => sum + (row.totalDocsExamined || 0),
          0,
        ),
        totalReturned: results.reduce(
          (sum, row) => sum + (row.nReturned || 0),
          0,
        ),
        averageScanRatio: safeNumber(
          results.reduce((sum, row) => sum + (row.scanRatio || 0), 0) /
            Math.max(results.length, 1),
        ),
      },
      markdownTable: renderMarkdownTable(results),
    };

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    const outFile = path.join(REPORT_DIR, `${label}.json`);
    fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

    console.log(`Saved query planning report: ${outFile}`);
    console.log("\nTop 10 query explain table:\n");
    console.log(report.markdownTable);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error("Query planning benchmark failed:", error);
  process.exit(1);
});
