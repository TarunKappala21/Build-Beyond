const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();

const REPORT_DIR = path.join(__dirname, "..", "perf-reports");
const REDIS_STATS_PATH = "/api/admin/cache/redis-stats";
const REDIS_STATS_RESET_PATH = "/api/admin/cache/redis-stats/reset";

const DEFAULT_ENDPOINT = {
  name: "Admin Platform Revenue Intelligence",
  method: "GET",
  path: "/api/admin/revenue/platform-intelligence?timeframe=month&page=1&limit=20",
};

const ENDPOINT_SUITES = {
  "admin-core": [
    {
      name: "Admin Verify Session",
      method: "GET",
      path: "/api/admin/verify-session",
    },
    {
      name: "Admin Dashboard",
      method: "GET",
      path: "/api/admindashboard",
    },
    {
      name: "Admin Analytics",
      method: "GET",
      path: "/api/admin/analytics",
    },
    {
      name: "Admin Revenue",
      method: "GET",
      path: "/api/admin/revenue",
    },
    {
      name: "Admin Platform Revenue Intelligence",
      method: "GET",
      path: "/api/admin/revenue/platform-intelligence?timeframe=month&page=1&limit=20",
    },
    {
      name: "Admin Settings",
      method: "GET",
      path: "/api/admin/settings",
    },
  ],
  "ongoing-customer": [
    {
      name: "Customer Ongoing Projects",
      method: "GET",
      path: "/api/ongoing_projects",
    },
  ],
  "ongoing-company": [
    {
      name: "Company Ongoing Projects",
      method: "GET",
      path: "/api/companyongoing_projects",
    },
  ],
  "ongoing-worker": [
    {
      name: "Worker Ongoing Projects",
      method: "GET",
      path: "/api/worker/ongoing-projects",
    },
  ],
};

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

const ensureReportDir = () => {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
};

const appendCacheBust = (url) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_rperf=${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeMethod = (method) =>
  String(method || "GET")
    .trim()
    .toUpperCase();

const deriveEndpointName = (endpointPath, method = "GET") => {
  const normalizedMethod = normalizeMethod(method);
  const cleanPath = String(endpointPath || "").split("?")[0];
  const parts = cleanPath
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/[{}:]/g, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (ch) => ch.toUpperCase()),
    );

  if (!parts.length) return `${normalizedMethod} Root`;
  return `${normalizedMethod} ${parts.join(" ")}`;
};

const parseEndpointToken = (token) => {
  const raw = String(token || "").trim();
  if (!raw) return null;

  let name = "";
  let method = "GET";
  let endpointPath = raw;

  if (raw.includes("::")) {
    const chunks = raw.split("::");
    name = String(chunks.shift() || "").trim();
    endpointPath = String(chunks.join("::") || "").trim();
  }

  const methodMatch = endpointPath.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(.+)$/i);
  if (methodMatch) {
    method = normalizeMethod(methodMatch[1]);
    endpointPath = String(methodMatch[2] || "").trim();
  }

  if (!endpointPath.startsWith("/")) {
    throw new Error(`Endpoint must start with '/': ${endpointPath}`);
  }

  return {
    name: name || deriveEndpointName(endpointPath, method),
    method,
    path: endpointPath,
  };
};

const resolveEndpoints = (options) => {
  const endpointSuiteName = options.endpointSuite || options.suite || "";

  if (endpointSuiteName) {
    const suite = ENDPOINT_SUITES[String(endpointSuiteName).trim()];
    if (!suite) {
      const available = Object.keys(ENDPOINT_SUITES).join(", ") || "none";
      throw new Error(
        `Unknown endpoint suite '${endpointSuiteName}'. Available suites: ${available}`,
      );
    }
    return suite.map((item) => ({
      name: item.name,
      method: normalizeMethod(item.method),
      path: item.path,
    }));
  }

  if (options.endpoints) {
    const tokens = String(options.endpoints)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!tokens.length) {
      throw new Error("--endpoints was provided but no valid endpoint tokens were found.");
    }

    return tokens.map(parseEndpointToken);
  }

  const endpointPath = options.endpoint || DEFAULT_ENDPOINT.path;
  const endpointMethod = normalizeMethod(options.method || DEFAULT_ENDPOINT.method);
  const endpointName = options.endpointName || deriveEndpointName(endpointPath, endpointMethod);

  return [
    {
      name: endpointName,
      method: endpointMethod,
      path: endpointPath,
    },
  ];
};

const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(index, 0)].toFixed(3));
};

const summarizeLatency = (values) => {
  if (!values.length) {
    return {
      count: 0,
      minMs: null,
      maxMs: null,
      avgMs: null,
      p50Ms: null,
      p95Ms: null,
      p99Ms: null,
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    count: values.length,
    minMs: Number(min.toFixed(3)),
    maxMs: Number(max.toFixed(3)),
    avgMs: Number((total / values.length).toFixed(3)),
    p50Ms: percentile(values, 50),
    p95Ms: percentile(values, 95),
    p99Ms: percentile(values, 99),
  };
};

const buildHeaders = (token, cookie) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (cookie) {
    headers.Cookie = cookie;
  }

  return headers;
};

const loginAdmin = async (baseUrl, email, password) => {
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for login.");
  }

  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Admin login failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  if (!payload.token) {
    throw new Error("Admin login succeeded but token is missing in response.");
  }

  return payload.token;
};

const loginByPath = async (baseUrl, loginPath, loginBody) => {
  const response = await fetch(`${baseUrl}${loginPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginBody || {}),
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      `Login failed on ${loginPath} (${response.status}): ${text}`,
    );
  }

  const setCookie =
    typeof response.headers.raw === "function"
      ? response.headers.raw()["set-cookie"] || []
      : [];
  const cookie = setCookie
    .map((cookieValue) => String(cookieValue || "").split(";")[0])
    .filter(Boolean)
    .join("; ");

  return {
    payload,
    token: payload?.token || "",
    cookie,
  };
};

const parseLoginBodyOption = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch (error) {
    throw new Error("Invalid --loginBody JSON provided.");
  }
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();

  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (error) {
      json = null;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    json,
    text,
  };
};

const fetchRedisStats = async (baseUrl, headers, { cacheBust = true } = {}) => {
  const statsUrl = `${baseUrl}${REDIS_STATS_PATH}`;
  const url = cacheBust ? appendCacheBust(statsUrl) : statsUrl;
  return requestJson(url, {
    method: "GET",
    headers,
  });
};

const resetRedisStats = async (baseUrl, headers) => {
  const resetUrl = `${baseUrl}${REDIS_STATS_RESET_PATH}`;
  return requestJson(resetUrl, {
    method: "POST",
    headers,
  });
};

const normalizeStats = (stats) => {
  const source = stats || {};
  return {
    hits: Number(source.hits || 0),
    misses: Number(source.misses || 0),
    sets: Number(source.sets || 0),
    invalidateCalls: Number(source.invalidateCalls || 0),
    invalidatedKeys: Number(source.invalidatedKeys || 0),
    skippedNoRedis: Number(source.skippedNoRedis || 0),
    errors: Number(source.errors || 0),
    totalOps: Number(source.totalOps || 0),
  };
};

const diffStats = (afterStats, beforeStats) => {
  const after = normalizeStats(afterStats);
  const before = normalizeStats(beforeStats);

  return {
    hits: after.hits - before.hits,
    misses: after.misses - before.misses,
    sets: after.sets - before.sets,
    invalidateCalls: after.invalidateCalls - before.invalidateCalls,
    invalidatedKeys: after.invalidatedKeys - before.invalidatedKeys,
    skippedNoRedis: after.skippedNoRedis - before.skippedNoRedis,
    errors: after.errors - before.errors,
    totalOps: after.totalOps - before.totalOps,
  };
};

const safeHitRatePct = (stats) => {
  const hits = Number(stats?.hits || 0);
  const misses = Number(stats?.misses || 0);
  const lookups = hits + misses;
  if (lookups <= 0) return null;
  return Number(((hits / lookups) * 100).toFixed(2));
};

const mergeStatusCounts = (target, source) => {
  Object.keys(source || {}).forEach((key) => {
    target[key] = Number(target[key] || 0) + Number(source[key] || 0);
  });
};

const runEndpointCapture = async ({
  baseUrl,
  endpoint,
  headers,
  requestCount,
  logEach,
  statsEach,
}) => {
  const beforeStatsResponse = await fetchRedisStats(baseUrl, headers, {
    cacheBust: true,
  });
  if (!beforeStatsResponse.ok || !beforeStatsResponse.json?.success) {
    throw new Error(
      `Failed to fetch pre-run Redis stats (${beforeStatsResponse.status}): ${beforeStatsResponse.text}`,
    );
  }

  const beforeStats = normalizeStats(beforeStatsResponse.json.stats);
  const latencyMs = [];
  const statusCount = {};

  console.log(
    `[redis-perf] Endpoint='${endpoint.name}' method=${endpoint.method} path=${endpoint.path} requests=${requestCount}`,
  );

  for (let i = 0; i < requestCount; i += 1) {
    const started = process.hrtime.bigint();
    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      headers,
    });
    const finished = process.hrtime.bigint();
    const elapsedMs = Number(finished - started) / 1e6;

    latencyMs.push(elapsedMs);
    const statusKey = String(response.status);
    statusCount[statusKey] = (statusCount[statusKey] || 0) + 1;

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Request failed endpoint='${endpoint.name}' iteration=${i + 1} status=${response.status}: ${text}`,
      );
    }

    await response.arrayBuffer();

    if (logEach) {
      let liveStatsText = "";

      if (statsEach) {
        const liveStatsResponse = await fetchRedisStats(baseUrl, headers, {
          cacheBust: true,
        });

        if (liveStatsResponse.ok && liveStatsResponse.json?.success) {
          const liveStats = normalizeStats(liveStatsResponse.json.stats || {});
          const liveHitRate = safeHitRatePct(liveStats);
          liveStatsText =
            ` hits=${liveStats.hits}` +
            ` misses=${liveStats.misses}` +
            ` sets=${liveStats.sets}` +
            ` skippedNoRedis=${liveStats.skippedNoRedis}` +
            ` hitRatePct=${liveHitRate === null ? "na" : liveHitRate}`;
        } else {
          liveStatsText = " liveStats=unavailable";
        }
      }

      console.log(
        `[redis-perf] [${endpoint.name}] #${i + 1}/${requestCount} method=${endpoint.method} path=${endpoint.path} status=${response.status} latencyMs=${elapsedMs.toFixed(3)}${liveStatsText}`,
      );
    }
  }

  const afterStatsResponse = await fetchRedisStats(baseUrl, headers, {
    cacheBust: true,
  });
  if (!afterStatsResponse.ok || !afterStatsResponse.json?.success) {
    throw new Error(
      `Failed to fetch post-run Redis stats (${afterStatsResponse.status}): ${afterStatsResponse.text}`,
    );
  }

  const afterStats = normalizeStats(afterStatsResponse.json.stats || {});
  const redisDelta = diffStats(afterStats, beforeStats);

  return {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    endpointId: `${endpoint.method} ${endpoint.path}`,
    requests: requestCount,
    latency: summarizeLatency(latencyMs),
    statusCount,
    redis: {
      delta: redisDelta,
      hitRatePct: safeHitRatePct(redisDelta),
      cacheLookups:
        Number(redisDelta.hits || 0) + Number(redisDelta.misses || 0),
    },
  };
};

const capture = async (options) => {
  const baseUrl = options.baseUrl || "http://localhost:3000";
  const endpoints = resolveEndpoints(options);
  const requestCount = toNumber(
    options.requestsPerEndpoint ?? options.requests,
    30,
  );
  const label = options.label || `capture-${Date.now()}`;
  const shouldLogin = String(options.login || "true") !== "false";
  const logEach = toBoolean(options.logEach, true);
  const statsEach = toBoolean(options.statsEach, true);

  let token = options.token || "";
  let cookie = options.cookie || "";

  if (shouldLogin && !token && !cookie) {
    const loginPath = options.loginPath || "/api/admin/login";

    if (loginPath === "/api/admin/login") {
      token = await loginAdmin(
        baseUrl,
        options.email || process.env.ADMIN_EMAIL,
        options.password || process.env.ADMIN_PASSWORD,
      );
    } else {
      const loginBody =
        parseLoginBodyOption(options.loginBody) || {
          email: options.email,
          password: options.password,
        };

      const hasCredentials =
        Object.prototype.hasOwnProperty.call(loginBody, "email") ||
        Object.prototype.hasOwnProperty.call(loginBody, "username");

      if (!hasCredentials) {
        throw new Error(
          "For non-admin login, provide --loginBody JSON or --email/--password.",
        );
      }

      const session = await loginByPath(baseUrl, loginPath, loginBody);
      token = session.token || token;
      cookie = session.cookie || cookie;

      if (!token && !cookie) {
        throw new Error(
          `Login on ${loginPath} succeeded but no token/cookie was returned.`,
        );
      }
    }
  }

  const headers = buildHeaders(token, cookie);

  const resetStats = await resetRedisStats(baseUrl, headers);

  if (!resetStats.ok) {
    throw new Error(
      `Failed to reset Redis stats (${resetStats.status}): ${resetStats.text}`,
    );
  }

  const overallLatencyMs = [];
  const overallStatusCount = {};
  const endpointResults = [];

  console.log(
    `[redis-perf] Starting capture label=${label} endpoints=${endpoints.length} requestsPerEndpoint=${requestCount}`,
  );

  for (const endpoint of endpoints) {
    const endpointResult = await runEndpointCapture({
      baseUrl,
      endpoint,
      headers,
      requestCount,
      logEach,
      statsEach,
    });

    endpointResults.push(endpointResult);
    mergeStatusCounts(overallStatusCount, endpointResult.statusCount);

    console.log(
      `[redis-perf] Completed endpoint='${endpointResult.name}' avgMs=${endpointResult.latency.avgMs} p95Ms=${endpointResult.latency.p95Ms} hitRatePct=${endpointResult.redis.hitRatePct === null ? "na" : endpointResult.redis.hitRatePct}`,
    );
  }

  endpointResults.forEach((item) => {
    const endpointAvg = Number(item.latency.avgMs || 0);
    for (let i = 0; i < Number(item.latency.count || 0); i += 1) {
      overallLatencyMs.push(endpointAvg);
    }
  });

  const statsResponse = await fetchRedisStats(baseUrl, headers, {
    cacheBust: true,
  });

  if (!statsResponse.ok || !statsResponse.json || !statsResponse.json.success) {
    throw new Error(
      `Failed to fetch Redis stats (${statsResponse.status}): ${statsResponse.text}`,
    );
  }

  const redisStats = normalizeStats(statsResponse.json.stats || {});
  const cacheLookups = Number(redisStats.hits || 0) + Number(redisStats.misses || 0);
  const hitRatePct = safeHitRatePct(redisStats);

  const totalRequests = endpointResults.reduce(
    (sum, item) => sum + Number(item.requests || 0),
    0,
  );

  const report = {
    label,
    capturedAt: new Date().toISOString(),
    runConfig: {
      baseUrl,
      requestCount,
      totalRequests,
      endpointCount: endpointResults.length,
      endpoints: endpointResults.map((item) => ({
        name: item.name,
        method: item.method,
        path: item.path,
        endpointId: item.endpointId,
      })),
      loginUsed: shouldLogin,
      tokenProvided: !!options.token,
      cookieProvided: !!options.cookie,
      loginPath: options.loginPath || "/api/admin/login",
    },
    latency: summarizeLatency(overallLatencyMs),
    statusCount: overallStatusCount,
    endpoints: endpointResults,
    redis: {
      stats: redisStats,
      hitRatePct,
      cacheLookups,
    },
  };

  ensureReportDir();
  const outFile = path.join(REPORT_DIR, `redis-cache-${label}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log("Saved report:", outFile);
  console.log("Latency summary:", report.latency);
  console.log(
    "Endpoint summaries:",
    endpointResults.map((item) => ({
      endpoint: item.name,
      method: item.method,
      path: item.path,
      avgMs: item.latency.avgMs,
      p95Ms: item.latency.p95Ms,
      hitRatePct: item.redis.hitRatePct,
      hits: item.redis.delta.hits,
      misses: item.redis.delta.misses,
      sets: item.redis.delta.sets,
      skippedNoRedis: item.redis.delta.skippedNoRedis,
    })),
  );
  console.log("Redis summary:", {
    hitRatePct: report.redis.hitRatePct,
    hits: redisStats.hits,
    misses: redisStats.misses,
    sets: redisStats.sets,
    skippedNoRedis: redisStats.skippedNoRedis,
  });
};

const compare = (options) => {
  const beforeLabel = options.before;
  const afterLabel = options.after;

  if (!beforeLabel || !afterLabel) {
    throw new Error("Use --before <label> and --after <label> in compare mode.");
  }

  const beforeFile = path.join(REPORT_DIR, `redis-cache-${beforeLabel}.json`);
  const afterFile = path.join(REPORT_DIR, `redis-cache-${afterLabel}.json`);

  if (!fs.existsSync(beforeFile) || !fs.existsSync(afterFile)) {
    throw new Error("One or both report files are missing. Capture both first.");
  }

  const before = JSON.parse(fs.readFileSync(beforeFile, "utf8"));
  const after = JSON.parse(fs.readFileSync(afterFile, "utf8"));

  const pctImprovement = (beforeValue, afterValue) => {
    if (
      typeof beforeValue !== "number" ||
      typeof afterValue !== "number" ||
      beforeValue === 0
    ) {
      return null;
    }
    return Number((((beforeValue - afterValue) / beforeValue) * 100).toFixed(2));
  };

  const result = {
    comparedAt: new Date().toISOString(),
    beforeLabel,
    afterLabel,
    latency: {
      avgMs: {
        before: before.latency?.avgMs ?? null,
        after: after.latency?.avgMs ?? null,
        improvementPct: pctImprovement(before.latency?.avgMs, after.latency?.avgMs),
      },
      p95Ms: {
        before: before.latency?.p95Ms ?? null,
        after: after.latency?.p95Ms ?? null,
        improvementPct: pctImprovement(before.latency?.p95Ms, after.latency?.p95Ms),
      },
      p99Ms: {
        before: before.latency?.p99Ms ?? null,
        after: after.latency?.p99Ms ?? null,
        improvementPct: pctImprovement(before.latency?.p99Ms, after.latency?.p99Ms),
      },
    },
    redis: {
      hitRatePct: {
        before: before.redis?.hitRatePct ?? null,
        after: after.redis?.hitRatePct ?? null,
      },
      hits: {
        before: before.redis?.stats?.hits ?? null,
        after: after.redis?.stats?.hits ?? null,
      },
      misses: {
        before: before.redis?.stats?.misses ?? null,
        after: after.redis?.stats?.misses ?? null,
      },
      skippedNoRedis: {
        before: before.redis?.stats?.skippedNoRedis ?? null,
        after: after.redis?.stats?.skippedNoRedis ?? null,
      },
    },
    endpoints: [],
  };

  const beforeEndpoints = Array.isArray(before.endpoints) ? before.endpoints : [];
  const afterEndpoints = Array.isArray(after.endpoints) ? after.endpoints : [];

  const beforeMap = new Map(
    beforeEndpoints.map((item) => [
      String(item.endpointId || `${item.method} ${item.path}`),
      item,
    ]),
  );
  const afterMap = new Map(
    afterEndpoints.map((item) => [
      String(item.endpointId || `${item.method} ${item.path}`),
      item,
    ]),
  );

  const endpointIds = Array.from(
    new Set([...beforeMap.keys(), ...afterMap.keys()]),
  ).sort();

  result.endpoints = endpointIds.map((endpointId) => {
    const beforeItem = beforeMap.get(endpointId);
    const afterItem = afterMap.get(endpointId);

    const endpointName =
      afterItem?.name ||
      beforeItem?.name ||
      deriveEndpointName((afterItem || beforeItem)?.path || "", (afterItem || beforeItem)?.method || "GET");

    return {
      endpointId,
      name: endpointName,
      method: afterItem?.method || beforeItem?.method || "GET",
      path: afterItem?.path || beforeItem?.path || "",
      latency: {
        avgMs: {
          before: beforeItem?.latency?.avgMs ?? null,
          after: afterItem?.latency?.avgMs ?? null,
          improvementPct: pctImprovement(
            beforeItem?.latency?.avgMs,
            afterItem?.latency?.avgMs,
          ),
        },
        p95Ms: {
          before: beforeItem?.latency?.p95Ms ?? null,
          after: afterItem?.latency?.p95Ms ?? null,
          improvementPct: pctImprovement(
            beforeItem?.latency?.p95Ms,
            afterItem?.latency?.p95Ms,
          ),
        },
      },
      redis: {
        hitRatePct: {
          before: beforeItem?.redis?.hitRatePct ?? null,
          after: afterItem?.redis?.hitRatePct ?? null,
        },
        hits: {
          before: beforeItem?.redis?.delta?.hits ?? null,
          after: afterItem?.redis?.delta?.hits ?? null,
        },
        misses: {
          before: beforeItem?.redis?.delta?.misses ?? null,
          after: afterItem?.redis?.delta?.misses ?? null,
        },
        sets: {
          before: beforeItem?.redis?.delta?.sets ?? null,
          after: afterItem?.redis?.delta?.sets ?? null,
        },
        skippedNoRedis: {
          before: beforeItem?.redis?.delta?.skippedNoRedis ?? null,
          after: afterItem?.redis?.delta?.skippedNoRedis ?? null,
        },
      },
    };
  });

  ensureReportDir();
  const outFile = path.join(
    REPORT_DIR,
    `redis-cache-compare-${beforeLabel}-vs-${afterLabel}.json`,
  );
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));

  console.log("Saved comparison:", outFile);
  console.log(
    "Endpoint comparison summary:",
    result.endpoints.map((item) => ({
      endpoint: item.name,
      method: item.method,
      path: item.path,
      avgMsBefore: item.latency.avgMs.before,
      avgMsAfter: item.latency.avgMs.after,
      avgImprovementPct: item.latency.avgMs.improvementPct,
      p95Before: item.latency.p95Ms.before,
      p95After: item.latency.p95Ms.after,
      p95ImprovementPct: item.latency.p95Ms.improvementPct,
    })),
  );
  console.log(JSON.stringify(result, null, 2));
};

const main = async () => {
  const options = parseArgs();
  const mode = options.mode || "capture";

  if (!["capture", "compare"].includes(mode)) {
    throw new Error("Invalid --mode. Use capture or compare.");
  }

  if (mode === "compare") {
    compare(options);
    return;
  }

  await capture(options);
};

main().catch((error) => {
  console.error("redis-cache-perf failed:", error.message);
  process.exit(1);
});
