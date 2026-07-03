const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

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

const loadReport = (label) => {
  const filePath = path.join(REPORT_DIR, `${label}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Report not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const safePct = (beforeValue, afterValue) => {
  if (
    typeof beforeValue !== "number" ||
    typeof afterValue !== "number" ||
    beforeValue === 0
  ) {
    return null;
  }

  return Number((((beforeValue - afterValue) / beforeValue) * 100).toFixed(2));
};

const renderTable = (rows) => {
  const header = [
    "Query",
    "Before Docs",
    "After Docs",
    "Before Returned",
    "After Returned",
    "Before Time (ms)",
    "After Time (ms)",
    "Before Scan Ratio",
    "After Scan Ratio",
  ];

  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.label} | ${row.before.totalDocsExamined ?? "n/a"} | ${row.after.totalDocsExamined ?? "n/a"} | ${row.before.nReturned ?? "n/a"} | ${row.after.nReturned ?? "n/a"} | ${row.before.executionTimeMillis ?? "n/a"} | ${row.after.executionTimeMillis ?? "n/a"} | ${row.before.scanRatio ?? "n/a"} | ${row.after.scanRatio ?? "n/a"} |`,
    );
  }

  return lines.join("\n");
};

const compareReports = (beforeReport, afterReport) => {
  const afterMap = new Map(
    afterReport.queries.map((entry) => [entry.key, entry]),
  );

  const rows = beforeReport.queries.map((beforeEntry) => {
    const afterEntry = afterMap.get(beforeEntry.key);
    if (!afterEntry) {
      return {
        key: beforeEntry.key,
        label: beforeEntry.label,
        route: beforeEntry.route,
        before: beforeEntry,
        after: {
          totalDocsExamined: null,
          nReturned: null,
          executionTimeMillis: null,
          scanRatio: null,
        },
        improvement: {
          executionTimeMillisPct: null,
          docsExaminedPct: null,
          scanRatioPct: null,
        },
      };
    }

    return {
      key: beforeEntry.key,
      label: beforeEntry.label,
      route: beforeEntry.route,
      before: beforeEntry,
      after: afterEntry,
      improvement: {
        executionTimeMillisPct: safePct(
          beforeEntry.executionTimeMillis,
          afterEntry.executionTimeMillis,
        ),
        docsExaminedPct: safePct(
          beforeEntry.totalDocsExamined,
          afterEntry.totalDocsExamined,
        ),
        scanRatioPct: safePct(beforeEntry.scanRatio, afterEntry.scanRatio),
      },
    };
  });

  const markdownTable = renderTable(rows);

  const average = (values) => {
    const numericValues = values.filter((value) => typeof value === "number");
    if (numericValues.length === 0) {
      return null;
    }

    return Number(
      (
        numericValues.reduce((sum, value) => sum + value, 0) /
        numericValues.length
      ).toFixed(3),
    );
  };

  return {
    label: `${beforeReport.label}-vs-${afterReport.label}`,
    capturedAt: new Date().toISOString(),
    beforeLabel: beforeReport.label,
    afterLabel: afterReport.label,
    queryCount: rows.length,
    rows,
    summary: {
      averageExecutionTimeBefore: average(
        rows.map((row) => row.before.executionTimeMillis),
      ),
      averageExecutionTimeAfter: average(
        rows.map((row) => row.after.executionTimeMillis),
      ),
      averageDocsExaminedBefore: average(
        rows.map((row) => row.before.totalDocsExamined),
      ),
      averageDocsExaminedAfter: average(
        rows.map((row) => row.after.totalDocsExamined),
      ),
      averageScanRatioBefore: average(rows.map((row) => row.before.scanRatio)),
      averageScanRatioAfter: average(rows.map((row) => row.after.scanRatio)),
    },
    markdownTable,
  };
};

const main = () => {
  const args = parseArgs();
  const beforeLabel = args.before;
  const afterLabel = args.after;

  if (!beforeLabel || !afterLabel) {
    throw new Error("Use --before <label> and --after <label>.");
  }

  const beforeReport = loadReport(beforeLabel);
  const afterReport = loadReport(afterLabel);
  const comparison = compareReports(beforeReport, afterReport);

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const outFile = path.join(
    REPORT_DIR,
    `compare-${beforeLabel}-vs-${afterLabel}.json`,
  );
  fs.writeFileSync(outFile, JSON.stringify(comparison, null, 2));

  console.log(`Saved query planning comparison: ${outFile}`);
  console.log("\nQuery planning comparison table:\n");
  console.log(comparison.markdownTable);
};

main();
