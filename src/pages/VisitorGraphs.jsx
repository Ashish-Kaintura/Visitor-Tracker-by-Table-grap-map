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

// Utility to normalize strings (for consistent grouping)
const normalizeValue = (value) =>
  value && value.trim() ? value.trim().toLowerCase() : null;

export default function VisitorGraphs() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://api.loopandcut.in/api/customer/all/location_logs")
      .then((res) => res.json())
      .then((data) => {
        const logs = Array.isArray(data) ? data : data.logs || data.data || [];
        setVisitors(logs);
      })
      .catch(() => setError("Failed to load visitor data."))
      .finally(() => setLoading(false));
  }, []);

  // Filter by date range
  const filteredVisitors = visitors.filter((v) => {
    if (!dateRange.start && !dateRange.end) return true;
    const visitDate = new Date(v.timestamp);
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    if (start && visitDate < start) return false;
    if (end && visitDate > end) return false;
    return true;
  });

  // KPI Data
  const totalVisitors = filteredVisitors.length;
  const uniqueVisitors = new Set(filteredVisitors.map((v) => v.ip)).size;

  const uniqueCountries = new Set(
    filteredVisitors.map((v) => normalizeValue(v.country)).filter(Boolean)
  ).size;

  const uniqueDevices = new Set(
    filteredVisitors.map((v) => normalizeValue(v.deviceType)).filter(Boolean)
  ).size;

  const topCity =
    Object.entries(
      filteredVisitors.reduce((acc, v) => {
        if (!v.city) return acc;
        acc[v.city] = (acc[v.city] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Chart Data — Countries
  const countryData = Object.values(
    filteredVisitors.reduce((acc, v) => {
      const country = normalizeValue(v.country);
      if (!country) return acc;
      acc[country] = acc[country] || { country, count: 0 };
      acc[country].count++;
      return acc;
    }, {})
  );

  // Chart Data — Devices
  const deviceData = Object.values(
    filteredVisitors.reduce((acc, v) => {
      const device = normalizeValue(v.deviceType);
      if (!device) return acc;
      acc[device] = acc[device] || { device, count: 0 };
      acc[device].count++;
      return acc;
    }, {})
  );

  // Chart Data — Visits Over Time
  const timeData = filteredVisitors
    .map((v) => ({
      date: new Date(v.timestamp).toLocaleDateString(),
      count: 1,
    }))
    .reduce((acc, curr) => {
      const found = acc.find((item) => item.date === curr.date);
      if (found) found.count++;
      else acc.push({ date: curr.date, count: 1 });
      return acc;
    }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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
        <div>
          <label className="block text-sm">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            className="border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            className="border rounded p-2"
          />
        </div>
        <button
          onClick={() => navigate("/visitorsmap")}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          View Map
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow flex items-center gap-3">
          <Users className="text-blue-500" />
          <div>
            <p className="text-gray-500">Total Visitors</p>
            <h3 className="text-xl font-bold">{totalVisitors}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center gap-3">
          <Users className="text-teal-500" />
          <div>
            <p className="text-gray-500">Unique Visitors</p>
            <h3 className="text-xl font-bold">{uniqueVisitors}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center gap-3">
          <Globe className="text-green-500" />
          <div>
            <p className="text-gray-500">Countries</p>
            <h3 className="text-xl font-bold">{uniqueCountries}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center gap-3">
          <Smartphone className="text-purple-500" />
          <div>
            <p className="text-gray-500">Devices</p>
            <h3 className="text-xl font-bold">{uniqueDevices}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex items-center gap-3">
          <Calendar className="text-orange-500" />
          <div>
            <p className="text-gray-500">Top City</p>
            <h3 className="text-xl font-bold">{topCity}</h3>
          </div>
        </div>
      </div>

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
              <BarChart data={countryData}>
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Visitors by Device */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-4">Visitors by Device</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  dataKey="count"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {deviceData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
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
