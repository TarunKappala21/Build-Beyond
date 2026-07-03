import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Home,
  Users,
  Building2,
  UserCog,
  FolderOpen,
  TrendingUp,
  Star,
  Briefcase,
  BarChart3,
  RefreshCw,
  Sparkles,
  Award,
  BadgeCheck,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import AdminLayout from "../../../components/admin/AdminLayout";
import {
  PageHeader,
  Section,
  Spinner,
  ActionButton,
} from "../../../components/admin/AdminUIComponents";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import "./AdminDashboard.css";

const TIME_FILTERS = ["week", "month", "quarter", "year", "all"];

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "customers", label: "Customers", icon: Users },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "workers", label: "Workers", icon: UserCog },
  { id: "projects-bids", label: "Projects & Bids", icon: FolderOpen },
  { id: "revenue-finance", label: "Revenue & Finance", icon: TrendingUp },
  { id: "star-members", label: "Star Members", icon: Star },
];

const FILTER_LABELS = {
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
  all: "All Time",
};

const PIE_COLORS = ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

const sectionTitleMeta = {
  customers: { color: "#3B82F6" },
  companies: { color: "#8B5CF6" },
  workers: { color: "#10B981" },
  projects: { color: "#F59E0B" },
  revenue: { color: "#E11D48" },
  stars: { color: "#F59E0B" },
};

const CARD_META = {
  customers: { title: "Total Customers", color: "blue", icon: Users },
  companies: { title: "Total Companies", color: "purple", icon: Building2 },
  workers: { title: "Total Workers", color: "emerald", icon: Briefcase },
  projects: { title: "Active Projects", color: "orange", icon: FolderOpen },
  pending: { title: "Pending Requests", color: "rose", icon: BarChart3 },
  bids: { title: "Open Bids", color: "indigo", icon: TrendingUp },
  commission: { title: "Total Commission", color: "rose", icon: Award },
  volume: { title: "Project Volume", color: "amber", icon: Sparkles },
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const compactNumber = (value) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value));

const workerTickName = (value) => {
  const name = String(value || "");
  return name.length > 12 ? `${name.slice(0, 12)}…` : name;
};

const emptyAnalytics = {
  charts: {
    overviewCards: [],
    customersTrend: [],
    customerActivity: [],
    companyStatus: [],
    activeProjectsDonut: [],
    workersTop: [],
    workerGrowth: [],
    projectStatusArea: [],
    projectTypeStack: [],
    revenueCombo: [],
    revenueBreakdown: [],
  },
  starMembers: {
    customer: {
      name: "N/A",
      avatar: "",
      projects: 0,
      spent: 0,
      rating: 0,
      badge: "Most Active",
    },
    worker: {
      name: "N/A",
      avatar: "",
      title: "Worker",
      earnings: 0,
      rating: 0,
      projects: 0,
      badge: "Highest Earner",
    },
    company: {
      name: "N/A",
      logo: "",
      projects: 0,
      value: 0,
      status: "unknown",
    },
    highlight: { name: "N/A", role: "Rising Star", metric: "0 average rating" },
    leaderboard: [],
  },
};

const AdminDashboard = () => {
  const { role } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState("month");
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const sectionRefs = useRef({});

  const fetchAnalytics = async (filter, options = { initial: false }) => {
    const isInitial = options.initial;

    if (isInitial) {
      setLoading(true);
    } else {
      setIsFilterLoading(true);
    }

    try {
      const res = await fetch(`/api/admin/analytics?timeFilter=${filter}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const json = await res.json();
      setAnalytics({
        charts: json?.charts || emptyAnalytics.charts,
        starMembers: json?.starMembers || emptyAnalytics.starMembers,
      });
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setIsFilterLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAnalytics("month", { initial: true });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      { root: null, threshold: 0.3, rootMargin: "-15% 0px -50% 0px" },
    );

    NAV_ITEMS.forEach((item) => {
      const section = sectionRefs.current[item.id];
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [loading, isFilterLoading]);

  const handleTabClick = (id) => {
    const section = sectionRefs.current[id];
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  const handleFilterChange = async (value) => {
    if (value === timeFilter) return;
    setTimeFilter(value);
    await fetchAnalytics(value, { initial: false });
  };

  const handleRefresh = async () => {
    await fetchAnalytics(timeFilter, { initial: false });
  };

  const derived = useMemo(() => {
    const charts = analytics?.charts || emptyAnalytics.charts;
    const overviewCards = (charts.overviewCards || []).map((card) => {
      const meta = CARD_META[card.key] || {
        title: card.key,
        color: "blue",
        icon: BarChart3,
      };
      const isCurrency = card.key === "commission" || card.key === "volume";
      return {
        ...card,
        title: meta.title,
        color: meta.color,
        icon: meta.icon,
        value: isCurrency
          ? `₹${toNumber(card.value).toLocaleString("en-IN")}`
          : toNumber(card.value),
      };
    });

    return {
      ...charts,
      overviewCards,
      starMembers: analytics?.starMembers || emptyAnalytics.starMembers,
    };
  }, [analytics]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <Spinner size="lg" />
          <p>Loading dashboard analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="error-container">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <ActionButton
            label="Retry"
            variant="primary"
            onClick={handleRefresh}
          />
        </div>
      </AdminLayout>
    );
  }

  const renderCard = (card) => {
    const Icon = card.icon || BarChart3;
    return (
      <div key={card.key} className={`premium-overview-card ${card.color}`}>
        <div className="premium-card-accent" />
        <div className="premium-card-head">
          <span className="premium-card-title">{card.title}</span>
          <div className="premium-card-icon-wrap">
            <Icon size={18} />
          </div>
        </div>
        <div className="premium-card-value">{card.value}</div>
        <div className="premium-sparkline-wrap">
          <ResponsiveContainer width="100%" height={42}>
            <LineChart data={card.sparkline || []}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="currentColor"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="dashboard-content premium-dashboard-bg">
        <PageHeader
          title={
            role === "platform_manager"
              ? "Platform Manager Dashboard"
              : "Admin Dashboard"
          }
          subtitle="Monitor and manage platform activities"
          actions={
            <ActionButton
              label="Refresh"
              icon={RefreshCw}
              variant="primary"
              onClick={handleRefresh}
            />
          }
        />

        <div className="dashboard-controls-row">
          <nav className="mini-nav" aria-label="Dashboard sections">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`mini-nav-pill ${activeSection === item.id ? "active" : ""}`}
                  onClick={() => handleTabClick(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="time-filter-wrap">
            {TIME_FILTERS.map((filterKey) => (
              <button
                key={filterKey}
                className={`time-filter-btn ${timeFilter === filterKey ? "active" : ""}`}
                onClick={() => handleFilterChange(filterKey)}
              >
                {FILTER_LABELS[filterKey]}
              </button>
            ))}
          </div>
        </div>

        {isFilterLoading ? (
          <div className="filter-loading-state">
            <Spinner size="lg" />
            <p>Updating dashboard for {FILTER_LABELS[timeFilter]}...</p>
          </div>
        ) : (
          <>
            <Section
              className="premium-section"
              title="General Overview"
              id="overview"
              ref={(node) => {
                sectionRefs.current.overview = node;
              }}
            >
              <div className="premium-overview-grid">
                {derived.overviewCards.map(renderCard)}
              </div>
            </Section>

            <Section
              className="premium-section"
              title="Customers"
              id="customers"
              ref={(node) => {
                sectionRefs.current.customers = node;
              }}
            >
              <div
                className="section-title-accent"
                style={{ borderColor: sectionTitleMeta.customers.color }}
              />
              <div className="chart-grid two-col">
                <div className="premium-chart-card blue">
                  <h4>New Customers Trend</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={derived.customersTrend || []}
                      margin={{ top: 10, right: 12, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="customers"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="premium-chart-card blue">
                  <h4>Active vs Inactive Customers</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={derived.customerActivity || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                      >
                        {(derived.customerActivity || []).map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>

            <Section
              className="premium-section"
              title="Companies"
              id="companies"
              ref={(node) => {
                sectionRefs.current.companies = node;
              }}
            >
              <div
                className="section-title-accent"
                style={{ borderColor: sectionTitleMeta.companies.color }}
              />
              <div className="chart-grid one-col">
                <div className="premium-chart-card purple" style={{ gridColumn: '1 / -1' }}>
                  <h4>Active Projects Share</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={derived.activeProjectsDonut || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={90}
                      >
                        <Cell fill="#8B5CF6" />
                        <Cell fill="#DDD6FE" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>

            <Section
              className="premium-section"
              title="Workers"
              id="workers"
              ref={(node) => {
                sectionRefs.current.workers = node;
              }}
            >
              <div
                className="section-title-accent"
                style={{ borderColor: sectionTitleMeta.workers.color }}
              />
              <div className="chart-grid two-col">
                <div className="premium-chart-card emerald">
                  <h4>Top 5 Workers by Rating</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={derived.workersTop || []}
                      layout="vertical"
                      margin={{ top: 10, right: 12, left: 28, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={130}
                        tickFormatter={workerTickName}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="rating"
                        fill="#10B981"
                        radius={[0, 10, 10, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="premium-chart-card emerald">
                  <h4>Active Workers Growth</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={derived.workerGrowth || []}
                      margin={{ top: 10, right: 12, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="active"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>

            <Section
              className="premium-section"
              title="Projects & Bids"
              id="projects-bids"
              ref={(node) => {
                sectionRefs.current["projects-bids"] = node;
              }}
            >
              <div
                className="section-title-accent"
                style={{ borderColor: sectionTitleMeta.projects.color }}
              />
              <div className="chart-grid two-col">
                <div className="premium-chart-card orange">
                  <h4>Project Status Distribution</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart
                      data={derived.projectStatusArea || []}
                      margin={{ top: 10, right: 12, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="projects"
                        stroke="#F59E0B"
                        fill="#FCD34D"
                        fillOpacity={0.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="premium-chart-card orange">
                  <h4>Project Types</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={derived.projectTypeStack || []}
                      margin={{ top: 10, right: 12, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="construction" stackId="a" fill="#F59E0B" />
                      <Bar dataKey="interior" stackId="a" fill="#FDBA74" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>

            <Section
              className="premium-section"
              title="Revenue & Finance"
              id="revenue-finance"
              ref={(node) => {
                sectionRefs.current["revenue-finance"] = node;
              }}
            >
              <div
                className="section-title-accent"
                style={{ borderColor: sectionTitleMeta.revenue.color }}
              />
              <div className="chart-grid two-col">
                <div className="premium-chart-card rose wide">
                  <h4>Revenue vs Commission</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart
                      data={derived.revenueCombo || []}
                      margin={{ top: 10, right: 12, left: 34, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={compactNumber} width={74} />
                      <Tooltip />
                      <Bar
                        dataKey="revenue"
                        fill="#FB7185"
                        radius={[8, 8, 0, 0]}
                      />
                      <Line
                        type="monotone"
                        dataKey="commission"
                        stroke="#E11D48"
                        strokeWidth={3}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="premium-chart-card rose">
                  <h4>Revenue Breakdown</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={derived.revenueBreakdown || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={92}
                      >
                        {(derived.revenueBreakdown || []).map(
                          (entry, index) => (
                            <Cell
                              key={`rev-${entry.name}`}
                              fill={
                                ["#E11D48", "#FB7185", "#FDA4AF"][index % 3]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>

            <Section
              className="premium-section"
              title="Star Members"
              id="star-members"
              ref={(node) => {
                sectionRefs.current["star-members"] = node;
              }}
            >
              <div
                className="section-title-accent"
                style={{ borderColor: sectionTitleMeta.stars.color }}
              />
              <div className="stars-grid">
                <div className="star-card">
                  <div className="star-header">
                    <img
                      src={derived.starMembers.customer.avatar}
                      alt={derived.starMembers.customer.name}
                    />
                    <span className="star-badge">
                      {derived.starMembers.customer.badge}
                    </span>
                  </div>
                  <h4>Star Customer of the Month</h4>
                  <p className="star-name">
                    {derived.starMembers.customer.name}
                  </p>
                  <ul>
                    <li>Projects: {derived.starMembers.customer.projects}</li>
                    <li>
                      Total Spent: ₹
                      {toNumber(
                        derived.starMembers.customer.spent,
                      ).toLocaleString("en-IN")}
                    </li>
                    <li>Rating Given: {derived.starMembers.customer.rating}</li>
                  </ul>
                </div>

                <div className="star-card">
                  <div className="star-header">
                    <img
                      src={derived.starMembers.worker.avatar}
                      alt={derived.starMembers.worker.name}
                    />
                    <span className="star-badge">
                      {derived.starMembers.worker.badge}
                    </span>
                  </div>
                  <h4>Star Worker of the Month</h4>
                  <p className="star-name">{derived.starMembers.worker.name}</p>
                  <p className="star-sub">{derived.starMembers.worker.title}</p>
                  <ul>
                    <li>
                      Earnings: ₹
                      {toNumber(
                        derived.starMembers.worker.earnings,
                      ).toLocaleString("en-IN")}
                    </li>
                    <li>Avg Rating: {derived.starMembers.worker.rating}</li>
                    <li>Projects: {derived.starMembers.worker.projects}</li>
                  </ul>
                </div>

                <div className="star-card">
                  <div className="star-header">
                    <img
                      src={derived.starMembers.company.logo}
                      alt={derived.starMembers.company.name}
                    />
                    <span className="star-badge verified">
                      <BadgeCheck size={14} />{" "}
                      {derived.starMembers.company.status}
                    </span>
                  </div>
                  <h4>Star Company of the Month</h4>
                  <p className="star-name">
                    {derived.starMembers.company.name}
                  </p>
                  <ul>
                    <li>Projects: {derived.starMembers.company.projects}</li>
                    <li>
                      Total Value: ₹
                      {toNumber(
                        derived.starMembers.company.value,
                      ).toLocaleString("en-IN")}
                    </li>
                  </ul>
                </div>

                <div className="star-card highlight">
                  <div className="star-highlight-icon">
                    <Sparkles size={20} />
                  </div>
                  <h4>Platform Highlight</h4>
                  <p className="star-name">
                    {derived.starMembers.highlight.name}
                  </p>
                  <p className="star-sub">
                    {derived.starMembers.highlight.role}
                  </p>
                  <p className="star-metric">
                    {derived.starMembers.highlight.metric}
                  </p>
                </div>
              </div>
              <div className="stars-actions">
                <ActionButton
                  label="View All"
                  icon={Award}
                  variant="primary"
                  onClick={() => setShowLeaderboard(true)}
                />
              </div>
            </Section>
          </>
        )}

        {showLeaderboard && (
          <div
            className="leaderboard-overlay"
            onClick={() => setShowLeaderboard(false)}
          >
            <div
              className="leaderboard-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="leaderboard-head">
                <h3>Top Performers Leaderboard</h3>
                <button onClick={() => setShowLeaderboard(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="leaderboard-list">
                {(derived.starMembers.leaderboard || []).map((item) => (
                  <div
                    key={`${item.rank}-${item.name}`}
                    className="leaderboard-row"
                  >
                    <span className="rank">#{item.rank}</span>
                    <span className="name">{item.name}</span>
                    <span className="category">{item.category}</span>
                    <span className="score">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
