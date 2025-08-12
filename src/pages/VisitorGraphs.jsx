import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Globe, Smartphone } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0"];

// Utility to group and count
const groupCount = (data, key) =>
  Object.values(
    data.reduce((acc, v) => {
      const value = v[key]?.trim().toLowerCase();
      if (!value) return acc;
      acc[value] = acc[value] || { [key]: value, count: 0 };
      acc[value].count++;
      return acc;
    }, {})
  );

export default function VisitorGraphs() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://api.loopandcut.in/api/customer/all/location_logs")
      .then((res) => res.json())
      .then((data) =>
        setVisitors(Array.isArray(data) ? data : data.logs || data.data || [])
      )
      .catch(() => setError("Failed to load visitor data."))
      .finally(() => setLoading(false));
  }, []);

  // Filter visitors by date range
  const filteredVisitors = visitors.filter((v) => {
    const visitDate = new Date(v.timestamp);
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    return (!start || visitDate >= start) && (!end || visitDate <= end);
  });

  // Visitors & Unique Visitors (based only on IP addresses)
  const ips = filteredVisitors.map((v) => v.ip).filter(Boolean);
  const totalVisitors = ips.length; // all visits
  const uniqueVisitors = new Set(ips).size; // unique IPs only

  // Other KPIs
  const countries = groupCount(filteredVisitors, "country");
  const devices = groupCount(filteredVisitors, "deviceType");

  // Visitors by City
  const cities = groupCount(filteredVisitors, "city")
    .sort((a, b) => b.count - a.count) // Sort by highest visits
    .slice(0, 10); // Top 10 cities

  const uniqueCountries = countries.length;
  const uniqueDevices = devices.length;
  const topCity =
    Object.entries(
      filteredVisitors.reduce((acc, v) => {
        if (v.city) acc[v.city] = (acc[v.city] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Visits over time
  const timeData = filteredVisitors.reduce((acc, v) => {
    const date = new Date(v.timestamp).toLocaleDateString();
    const item = acc.find((d) => d.date === date);
    if (item) item.count++;
    else acc.push({ date, count: 1 });
    return acc;
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📈 Visitor Analytics</h1>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Back to Table
        </button>
      </div>

      {/* Date Range Picker */}
      <div className="flex gap-4 mb-6">
        {["start", "end"].map((type) => (
          <div key={type}>
            <label className="block text-sm">
              {type === "start" ? "Start Date" : "End Date"}
            </label>
            <input
              type="date"
              value={dateRange[type]}
              onChange={(e) =>
                setDateRange({ ...dateRange, [type]: e.target.value })
              }
              className="border rounded p-2"
            />
          </div>
        ))}
        {/* Reset Button */}
        <button
          onClick={() => setDateRange({ start: "", end: "" })}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Reset
        </button>
        <button
          onClick={() => navigate("/visitorsmap")}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          View Map
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {[
          {
            label: "Total Visitors",
            value: totalVisitors,
            icon: <Users className="text-blue-500" />,
          },
          {
            label: "Unique Visitors",
            value: uniqueVisitors,
            icon: <Users className="text-teal-500" />,
          },
          {
            label: "Countries",
            value: uniqueCountries,
            icon: <Globe className="text-green-500" />,
          },
          {
            label: "Devices",
            value: uniqueDevices,
            icon: <Smartphone className="text-purple-500" />,
          },
          {
            label: "Top City",
            value: topCity,
            icon: <Calendar className="text-orange-500" />,
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded shadow flex items-center gap-3"
          >
            {kpi.icon}
            <div>
              <p className="text-gray-500">{kpi.label}</p>
              <h3 className="text-xl font-bold">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {loading ? (
        <p>Loading charts...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : totalVisitors === 0 ? (
        <p>No data available for the selected range.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visitors by Country */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-4">Visitors by Country</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countries}>
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Visitors by City */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-4">Visitors by City (Top 10)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cities}>
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Visitors by Device */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-4">Visitors by Device</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={devices}
                  dataKey="count"
                  nameKey="deviceType"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {devices.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Visits Over Time */}
          <div className="bg-white p-4 rounded shadow md:col-span-2">
            <h2 className="font-semibold mb-4">Visits Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#FF8042" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
