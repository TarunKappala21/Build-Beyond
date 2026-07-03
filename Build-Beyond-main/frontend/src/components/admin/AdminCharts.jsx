import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./AdminCharts.css";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

/* Line Chart Component */
export const LineChartComponent = ({ data, title, dataKey = "value" }) => (
  <div className="chart-container">
    {title && <h3 className="chart-title">{title}</h3>}
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", r: 4 }}
          activeDot={{ r: 6 }}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

/* Bar Chart Component */
export const BarChartComponent = ({ data, title, dataKey = "value" }) => (
  <div className="chart-container">
    {title && <h3 className="chart-title">{title}</h3>}
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Bar
          dataKey={dataKey}
          fill="url(#barGradient)"
          radius={[8, 8, 0, 0]}
          isAnimationActive={true}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/* Pie Chart Component */
export const PieChartComponent = ({ data, title, dataKey = "value" }) => (
  <div className="chart-container">
    {title && <h3 className="chart-title">{title}</h3>}
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey={dataKey}
          isAnimationActive={true}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

/* Dual Line Chart Component */
export const DualLineChartComponent = ({ data, title, dataKey1, dataKey2 }) => (
  <div className="chart-container">
    {title && <h3 className="chart-title">{title}</h3>}
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="line1Gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="line2Gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={dataKey1}
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", r: 4 }}
          activeDot={{ r: 6 }}
          isAnimationActive={true}
        />
        <Line
          type="monotone"
          dataKey={dataKey2}
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: "#8b5cf6", r: 4 }}
          activeDot={{ r: 6 }}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
