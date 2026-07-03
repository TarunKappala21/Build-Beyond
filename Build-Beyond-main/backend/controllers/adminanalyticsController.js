const {
  Customer,
  Company,
  Worker,
  ArchitectHiring,
  ConstructionProjectSchema,
  DesignRequest,
  Bid,
} = require("../models");
const {
  buildCacheKey,
  getCacheJson,
  setCacheJson,
  logRedisEndpointCache,
} = require("../utils/redisCache");

const ADMIN_ANALYTICS_CACHE_PREFIX = "admin:analytics:v1";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getRangeBounds = (filter) => {
  const now = new Date();
  const end = new Date(now);
  let start = null;

  if (filter === "week") {
    start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (filter === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filter === "quarter") {
    start = new Date(now);
    start.setMonth(now.getMonth() - 2, 1);
    start.setHours(0, 0, 0, 0);
  } else if (filter === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  }

  return { start, end };
};

const queryFromRange = ({ start, end }) =>
  start ? { createdAt: { $gte: start, $lte: end } } : {};

const makeDateKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const makeLabel = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const lastNDaysTrend = (items, valueGetter, days = 7) => {
  const now = new Date();
  const dayBuckets = [];
  const bucketMap = new Map();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    date.setHours(0, 0, 0, 0);
    const key = makeDateKey(date);
    bucketMap.set(key, 0);
    dayBuckets.push({ key, name: makeLabel(date) });
  }

  items.forEach((item) => {
    if (!item?.createdAt) return;
    const key = makeDateKey(item.createdAt);
    if (!bucketMap.has(key)) return;
    bucketMap.set(key, bucketMap.get(key) + toNumber(valueGetter(item)));
  });

  return dayBuckets.map((bucket) => ({
    name: bucket.name,
    value: Math.round(bucketMap.get(bucket.key) || 0),
  }));
};

const buildSeriesBuckets = (filter) => {
  const now = new Date();
  const buckets = [];

  if (filter === "week") {
    for (let i = 6; i >= 0; i -= 1) {
      const start = new Date(now);
      start.setDate(now.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      buckets.push({ start, end, name: makeLabel(start) });
    }
    return buckets;
  }

  if (filter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = now.getDate();
    for (let i = 0; i < daysInMonth; i += 1) {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      buckets.push({ start: dayStart, end: dayEnd, name: makeLabel(dayStart) });
    }
    return buckets;
  }

  if (filter === "quarter") {
    for (let i = 11; i >= 0; i -= 1) {
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      buckets.push({ start, end, name: `W${12 - i}` });
    }
    return buckets;
  }

  for (let i = 11; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      0,
      23,
      59,
      59,
      999,
    );
    buckets.push({
      start,
      end,
      name: start.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  return buckets;
};

const buildBucketSeries = (items, filter, valueGetter, valueKey) => {
  const buckets = buildSeriesBuckets(filter);

  return buckets.map((bucket) => {
    let total = 0;
    items.forEach((item) => {
      if (!item?.createdAt) return;
      const createdAt = new Date(item.createdAt);
      if (createdAt >= bucket.start && createdAt <= bucket.end) {
        total += toNumber(valueGetter(item));
      }
    });

    return {
      name: bucket.name,
      [valueKey]: Math.round(total),
    };
  });
};

const sumRevenue = (doc) =>
  toNumber(doc?.paymentDetails?.totalAmount) ||
  toNumber(doc?.estimatedBudget) ||
  0;

const sumCommission = (doc) =>
  toNumber(doc?.paymentDetails?.platformCommission) ||
  toNumber(doc?.paymentDetails?.platformFee) ||
  0;

const getAdminAnalytics = async (req, res) => {
  try {
    const startedAt = process.hrtime.bigint();
    const timeFilter = (req.query.timeFilter || "month").toLowerCase();
    const validFilter = ["week", "month", "quarter", "year", "all"].includes(
      timeFilter,
    )
      ? timeFilter
      : "month";

    const cacheKey = buildCacheKey(ADMIN_ANALYTICS_CACHE_PREFIX, {
      timeFilter: validFilter,
    });

    const cachedPayload = await getCacheJson(cacheKey);
    if (cachedPayload) {
      logRedisEndpointCache("hit", req.originalUrl, startedAt);
      return res.status(200).json(cachedPayload);
    }

    const range = getRangeBounds(validFilter);
    const query = queryFromRange(range);

    const [
      customers,
      companies,
      workers,
      architectHirings,
      constructionProjects,
      designRequests,
      bids,
      allCustomers,
      allWorkers,
      allCompanies,
    ] = await Promise.all([
      Customer.find(query).select("name reviews createdAt"),
      Company.find(query).select(
        "status companyName projectsCompleted createdAt",
      ),
      Worker.find(query).select(
        "name specialization professionalTitle rating profileImage earnings availability createdAt",
      ),
      ArchitectHiring.find(query).select(
        "projectName customer worker status customerDetails additionalDetails paymentDetails review createdAt",
      ),
      ConstructionProjectSchema.find(query).select(
        "projectName customerId customerName companyId status paymentDetails estimatedBudget buildingType customerReview createdAt",
      ),
      DesignRequest.find(query).select(
        "projectName fullName customerId workerId status roomType paymentDetails review createdAt",
      ),
      Bid.find(query).select(
        "projectName customerId customerName status estimatedBudget projectTimeline buildingType paymentDetails createdAt",
      ),
      Customer.find({}).select("name"),
      Worker.find({}).select(
        "name specialization professionalTitle rating profileImage earnings",
      ),
      Company.find({}).select("companyName status"),
    ]);

    const customerMap = new Map(
      allCustomers.map((customer) => [String(customer._id), customer]),
    );
    const workerMap = new Map(
      allWorkers.map((worker) => [String(worker._id), worker]),
    );
    const companyMap = new Map(
      allCompanies.map((company) => [String(company._id), company]),
    );

    const counts = {
      customers: customers.length,
      companies: companies.length,
      workers: workers.length,
    };

    const pendingArchitect = architectHirings.filter(
      (item) => (item.status || "").toLowerCase() === "pending",
    ).length;
    const pendingDesign = designRequests.filter(
      (item) => (item.status || "").toLowerCase() === "pending",
    ).length;

    const stats = {
      activeProjects: constructionProjects.filter(
        (project) => (project.status || "").toLowerCase() === "accepted",
      ).length,
      pendingRequests: pendingArchitect + pendingDesign,
      openBids: bids.filter(
        (bid) => (bid.status || "").toLowerCase() === "open",
      ).length,
    };

    const architectRevenue = architectHirings.reduce(
      (acc, item) => {
        acc.totalProjects += 1;
        acc.totalRevenue += sumRevenue(item);
        acc.platformCommission += sumCommission(item);
        acc.workerPayout += toNumber(item?.paymentDetails?.workerAmount);
        return acc;
      },
      {
        totalProjects: 0,
        totalRevenue: 0,
        platformCommission: 0,
        workerPayout: 0,
      },
    );

    const designRevenue = designRequests.reduce(
      (acc, item) => {
        acc.totalProjects += 1;
        acc.totalRevenue += sumRevenue(item);
        acc.platformCommission += sumCommission(item);
        acc.workerPayout += toNumber(item?.paymentDetails?.workerAmount);
        return acc;
      },
      {
        totalProjects: 0,
        totalRevenue: 0,
        platformCommission: 0,
        workerPayout: 0,
      },
    );

    const constructionCommission = constructionProjects.reduce(
      (sum, project) => sum + toNumber(project?.paymentDetails?.platformFee),
      0,
    );

    const bidCommission = bids.reduce(
      (sum, bid) => sum + toNumber(bid?.paymentDetails?.platformFee),
      0,
    );

    const combinedCommission =
      architectRevenue.platformCommission +
      designRevenue.platformCommission +
      constructionCommission +
      bidCommission;

    const combinedRevenue =
      architectRevenue.totalRevenue +
      designRevenue.totalRevenue +
      constructionProjects.reduce(
        (sum, project) => sum + sumRevenue(project),
        0,
      ) +
      bids.reduce((sum, bid) => sum + sumRevenue(bid), 0);

    const revenue = {
      architectHiring: architectRevenue,
      designRequest: designRevenue,
      combined: {
        totalPlatformCommission: combinedCommission,
        totalProjectRevenue: combinedRevenue,
      },
    };

    const activeCustomerIds = new Set();
    architectHirings.forEach(
      (item) => item.customer && activeCustomerIds.add(String(item.customer)),
    );
    constructionProjects.forEach(
      (item) =>
        item.customerId && activeCustomerIds.add(String(item.customerId)),
    );
    designRequests.forEach(
      (item) =>
        item.customerId && activeCustomerIds.add(String(item.customerId)),
    );
    bids.forEach(
      (item) =>
        item.customerId && activeCustomerIds.add(String(item.customerId)),
    );

    const customerActivity = [
      { name: "Active", value: activeCustomerIds.size },
      {
        name: "Inactive",
        value: Math.max(0, customers.length - activeCustomerIds.size),
      },
    ];

    const companyStatus = [
      {
        name: "Verified",
        count: companies.filter((company) => company.status === "verified")
          .length,
      },
      {
        name: "Pending",
        count: companies.filter((company) => company.status === "pending")
          .length,
      },
      {
        name: "Rejected",
        count: companies.filter((company) => company.status === "rejected")
          .length,
      },
    ];

    const workersTop = [...workers]
      .sort((a, b) => toNumber(b.rating) - toNumber(a.rating))
      .slice(0, 5)
      .map((worker, index) => ({
        name: worker.name?.split(" ")[0] || `Worker ${index + 1}`,
        rating: Number(toNumber(worker.rating).toFixed(1)),
      }));

    const projectStatusArea = [
      {
        name: "Pending",
        projects: constructionProjects.filter(
          (project) => project.status === "pending",
        ).length,
      },
      {
        name: "Accepted",
        projects: constructionProjects.filter(
          (project) => project.status === "accepted",
        ).length,
      },
      {
        name: "Rejected",
        projects: constructionProjects.filter(
          (project) => project.status === "rejected",
        ).length,
      },
      {
        name: "Proposal",
        projects: constructionProjects.filter(
          (project) => project.status === "proposal_sent",
        ).length,
      },
    ];

    const typeCounts = new Map();
    constructionProjects.forEach((project) => {
      const key = project.buildingType || "other";
      const current = typeCounts.get(key) || {
        name: key,
        construction: 0,
        interior: 0,
      };
      current.construction += 1;
      typeCounts.set(key, current);
    });
    designRequests.forEach((request) => {
      const key = request.roomType || "other";
      const current = typeCounts.get(key) || {
        name: key,
        construction: 0,
        interior: 0,
      };
      current.interior += 1;
      typeCounts.set(key, current);
    });

    const projectTypeStack = [...typeCounts.values()]
      .sort(
        (a, b) => b.construction + b.interior - (a.construction + a.interior),
      )
      .slice(0, 6)
      .map((item) => ({
        ...item,
        name:
          String(item.name).charAt(0).toUpperCase() +
          String(item.name).slice(1),
      }));

    const revenueItems = [
      ...architectHirings,
      ...designRequests,
      ...constructionProjects,
      ...bids,
    ];

    const overviewCards = [
      {
        key: "customers",
        value: counts.customers,
        sparkline: lastNDaysTrend(customers, () => 1),
      },
      {
        key: "companies",
        value: counts.companies,
        sparkline: lastNDaysTrend(companies, () => 1),
      },
      {
        key: "workers",
        value: counts.workers,
        sparkline: lastNDaysTrend(workers, () => 1),
      },
      {
        key: "projects",
        value: stats.activeProjects,
        sparkline: lastNDaysTrend(constructionProjects, (project) =>
          project.status === "accepted" ? 1 : 0,
        ),
      },
      {
        key: "pending",
        value: stats.pendingRequests,
        sparkline: lastNDaysTrend(
          [...architectHirings, ...designRequests],
          (item) => ((item.status || "").toLowerCase() === "pending" ? 1 : 0),
        ),
      },
      {
        key: "bids",
        value: stats.openBids,
        sparkline: lastNDaysTrend(bids, (bid) =>
          (bid.status || "").toLowerCase() === "open" ? 1 : 0,
        ),
      },
      {
        key: "commission",
        value: combinedCommission,
        sparkline: lastNDaysTrend(revenueItems, (item) => sumCommission(item)),
      },
      {
        key: "volume",
        value: combinedRevenue,
        sparkline: lastNDaysTrend(revenueItems, (item) => sumRevenue(item)),
      },
    ];

    const customersTrend = buildBucketSeries(
      customers,
      validFilter,
      () => 1,
      "customers",
    );
    const workerGrowth = buildBucketSeries(
      [...architectHirings, ...designRequests],
      validFilter,
      (item) => (item.worker || item.workerId ? 1 : 0),
      "active",
    );

    const revenueCombo = buildBucketSeries(
      revenueItems,
      validFilter,
      (item) => sumRevenue(item),
      "revenue",
    ).map((entry, index) => ({
      ...entry,
      commission: Math.round(
        toNumber(
          buildBucketSeries(
            revenueItems,
            validFilter,
            (item) => sumCommission(item),
            "commission",
          )[index]?.commission,
        ),
      ),
    }));

    const activeProjectsDonut = [
      { name: "Active Projects", value: stats.activeProjects },
      {
        name: "Other",
        value: Math.max(0, constructionProjects.length - stats.activeProjects),
      },
    ];

    const revenueBreakdown = [
      {
        name: "Architect Hiring",
        value: Math.round(architectRevenue.platformCommission),
      },
      {
        name: "Interior Design",
        value: Math.round(designRevenue.platformCommission),
      },
      {
        name: "Construction & Bids",
        value: Math.round(constructionCommission + bidCommission),
      },
    ];

    const customerSpendMap = new Map();
    const customerProjectCountMap = new Map();

    architectHirings.forEach((item) => {
      if (!item.customer) return;
      const key = String(item.customer);
      customerSpendMap.set(
        key,
        (customerSpendMap.get(key) || 0) + sumRevenue(item),
      );
      customerProjectCountMap.set(
        key,
        (customerProjectCountMap.get(key) || 0) + 1,
      );
    });

    constructionProjects.forEach((item) => {
      if (!item.customerId) return;
      const key = String(item.customerId);
      customerSpendMap.set(
        key,
        (customerSpendMap.get(key) || 0) + sumRevenue(item),
      );
      customerProjectCountMap.set(
        key,
        (customerProjectCountMap.get(key) || 0) + 1,
      );
    });

    designRequests.forEach((item) => {
      if (!item.customerId) return;
      const key = String(item.customerId);
      customerSpendMap.set(
        key,
        (customerSpendMap.get(key) || 0) + sumRevenue(item),
      );
      customerProjectCountMap.set(
        key,
        (customerProjectCountMap.get(key) || 0) + 1,
      );
    });

    const bestCustomerId = [...customerSpendMap.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const bestCustomerDoc = bestCustomerId
      ? customerMap.get(bestCustomerId)
      : null;

    const workerEarningMap = new Map();
    const workerProjectCountMap = new Map();

    architectHirings.forEach((item) => {
      if (!item.worker) return;
      const key = String(item.worker);
      workerEarningMap.set(
        key,
        (workerEarningMap.get(key) || 0) +
          toNumber(item?.paymentDetails?.workerAmount),
      );
      workerProjectCountMap.set(key, (workerProjectCountMap.get(key) || 0) + 1);
    });

    designRequests.forEach((item) => {
      if (!item.workerId) return;
      const key = String(item.workerId);
      workerEarningMap.set(
        key,
        (workerEarningMap.get(key) || 0) +
          toNumber(item?.paymentDetails?.workerAmount),
      );
      workerProjectCountMap.set(key, (workerProjectCountMap.get(key) || 0) + 1);
    });

    const bestWorkerId = [...workerEarningMap.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const bestWorkerDoc = bestWorkerId ? workerMap.get(bestWorkerId) : null;

    const companyValueMap = new Map();
    const companyProjectCountMap = new Map();

    constructionProjects.forEach((item) => {
      if (!item.companyId) return;
      const key = String(item.companyId);
      companyValueMap.set(
        key,
        (companyValueMap.get(key) || 0) + sumRevenue(item),
      );
      companyProjectCountMap.set(
        key,
        (companyProjectCountMap.get(key) || 0) + 1,
      );
    });

    const bestCompanyId = [...companyValueMap.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const bestCompanyDoc = bestCompanyId ? companyMap.get(bestCompanyId) : null;

    const risingWorkerDoc =
      [...allWorkers]
        .filter((worker) => toNumber(worker.rating) >= 4)
        .sort((a, b) => toNumber(b.rating) - toNumber(a.rating))[1] ||
      bestWorkerDoc;

    const customerRatingGiven =
      Array.isArray(bestCustomerDoc?.reviews) && bestCustomerDoc.reviews.length
        ? bestCustomerDoc.reviews.reduce(
            (sum, review) => sum + toNumber(review.rating),
            0,
          ) / bestCustomerDoc.reviews.length
        : 0;

    const starMembers = {
      customer: {
        name: bestCustomerDoc?.name || "N/A",
        avatar: bestCustomerDoc?.name
          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(bestCustomerDoc.name)}&background=3B82F6&color=fff`
          : "https://ui-avatars.com/api/?name=NA&background=3B82F6&color=fff",
        projects: customerProjectCountMap.get(bestCustomerId) || 0,
        spent: Math.round(customerSpendMap.get(bestCustomerId) || 0),
        rating: Number(customerRatingGiven.toFixed(1)),
        badge: "Most Active",
      },
      worker: {
        name: bestWorkerDoc?.name || "N/A",
        avatar:
          bestWorkerDoc?.profileImage ||
          (bestWorkerDoc?.name
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(bestWorkerDoc.name)}&background=10B981&color=fff`
            : "https://ui-avatars.com/api/?name=NA&background=10B981&color=fff"),
        title:
          bestWorkerDoc?.professionalTitle ||
          bestWorkerDoc?.specialization ||
          "Worker",
        earnings: Math.round(
          workerEarningMap.get(bestWorkerId) ||
            toNumber(bestWorkerDoc?.earnings?.monthlyEarnings),
        ),
        rating: Number(toNumber(bestWorkerDoc?.rating).toFixed(1)),
        projects: workerProjectCountMap.get(bestWorkerId) || 0,
        badge:
          toNumber(bestWorkerDoc?.rating) >= 4.8
            ? "Best Rated"
            : "Highest Earner",
      },
      company: {
        name: bestCompanyDoc?.companyName || "N/A",
        logo: bestCompanyDoc?.companyName
          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(bestCompanyDoc.companyName)}&background=F59E0B&color=fff`
          : "https://ui-avatars.com/api/?name=NA&background=F59E0B&color=fff",
        projects: companyProjectCountMap.get(bestCompanyId) || 0,
        value: Math.round(companyValueMap.get(bestCompanyId) || 0),
        status: bestCompanyDoc?.status || "unknown",
      },
      highlight: {
        name: risingWorkerDoc?.name || "N/A",
        role:
          risingWorkerDoc?.professionalTitle ||
          risingWorkerDoc?.specialization ||
          "Rising Star",
        metric: `${Number(toNumber(risingWorkerDoc?.rating).toFixed(1)) || 0} average rating`,
      },
      leaderboard: [],
    };

    const leaderboard = [
      {
        name: starMembers.worker.name,
        category: "Worker",
        score: `₹${toNumber(starMembers.worker.earnings).toLocaleString("en-IN")}`,
        rankScore: toNumber(starMembers.worker.earnings),
      },
      {
        name: starMembers.company.name,
        category: "Company",
        score: `${toNumber(starMembers.company.projects)} Projects`,
        rankScore: toNumber(starMembers.company.projects) * 1000,
      },
      {
        name: starMembers.customer.name,
        category: "Customer",
        score: `₹${toNumber(starMembers.customer.spent).toLocaleString("en-IN")}`,
        rankScore: toNumber(starMembers.customer.spent),
      },
    ]
      .filter((entry) => entry.name && entry.name !== "N/A")
      .sort((a, b) => b.rankScore - a.rankScore)
      .map((entry, index) => ({
        rank: index + 1,
        name: entry.name,
        category: entry.category,
        score: entry.score,
      }));

    starMembers.leaderboard = leaderboard;

    const responsePayload = {
      timeFilter: validFilter,
      counts,
      stats,
      revenue,
      charts: {
        overviewCards,
        customersTrend,
        customerActivity,
        companyStatus,
        activeProjectsDonut,
        workersTop,
        workerGrowth,
        projectStatusArea,
        projectTypeStack,
        revenueCombo,
        revenueBreakdown,
      },
      starMembers,
    };

    await setCacheJson(cacheKey, responsePayload, 120);
    logRedisEndpointCache("miss", req.originalUrl, startedAt);

    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    res.status(500).json({ error: "Failed to fetch admin analytics" });
  }
};

module.exports = { getAdminAnalytics };
