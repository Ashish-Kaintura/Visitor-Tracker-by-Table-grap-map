import React, { useEffect, useState, useRef } from "react";
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";
import { geoMercator, geoPath } from "d3-geo";
import { useNavigate } from "react-router-dom";

const DEVICE_COLORS = {
  mobile: "#1f77b4",
  tablet: "#ff7f0e",
  desktop: "#2ca02c",
  unknown: "#9467bd",
};

export default function VisitorMap() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countries, setCountries] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);
  const navigate = useNavigate();

  // fetch visitors
  useEffect(() => {
    setLoading(true);
    fetch("https://api.loopandcut.in/api/customer/all/location_logs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch visitors");
        return res.json();
      })
      .then((data) => {
        const logs = Array.isArray(data) ? data : data.logs || data.data || [];
        const withCoords = logs.filter(
          (v) => v.latitude != null && v.longitude != null
        );
        setVisitors(withCoords);
      })
      .catch((err) => setError(err.message || "Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  // topojson to geojson
  useEffect(() => {
    try {
      const countriesGeo = feature(
        worldData,
        worldData.objects.countries
      ).features;
      setCountries(countriesGeo);
    } catch (err) {
      console.error(err);
      setCountries([]);
    }
  }, []);

  // responsive dims
  const [size, setSize] = useState({ width: 900, height: 500 });
  useEffect(() => {
    const calc = () => {
      const parent = svgRef.current?.parentElement;
      const width = parent ? Math.min(parent.clientWidth, 1200) : 900;
      const height = Math.round(width * 0.52);
      setSize({ width, height });
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const projection = geoMercator().fitSize([size.width, size.height], {
    type: "FeatureCollection",
    features: countries,
  });
  const path = geoPath().projection(projection);

  // jitter for identical coords
  const coordsKey = (lat, lon) => `${lat.toFixed(5)}|${lon.toFixed(5)}`;
  const jitteredPoints = (() => {
    const groups = {};
    visitors.forEach((v) => {
      const key = coordsKey(v.latitude, v.longitude);
      groups[key] = groups[key] || [];
      groups[key].push(v);
    });
    const out = [];
    Object.values(groups).forEach((group) => {
      if (group.length === 1) {
        out.push({ v: group[0], offsetIndex: 0, total: 1 });
      } else {
        const r = 4;
        group.forEach((g, i) => {
          out.push({
            v: g,
            offsetIndex: i,
            total: group.length,
            radius: r,
          });
        });
      }
    });
    return out;
  })();

  const pointsScreen = jitteredPoints.map(
    ({ v, offsetIndex, total, radius = 4 }) => {
      const [x, y] = projection([Number(v.longitude), Number(v.latitude)]);
      let jitterX = 0;
      let jitterY = 0;
      if (total > 1) {
        const angle = (offsetIndex / total) * Math.PI * 2;
        jitterX = Math.cos(angle) * radius;
        jitterY = Math.sin(angle) * radius;
      }
      return {
        id: v._id,
        cx: x + jitterX,
        cy: y + jitterY,
        visitor: v,
        color: DEVICE_COLORS[v.deviceType] || DEVICE_COLORS.unknown,
      };
    }
  );

  const handleMouseEnter = (e, p) => {
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip({
      x: rect.left + p.cx,
      y: rect.top + p.cy,
      visitor: p.visitor,
    });
  };
  const handleMouseLeave = () => setTooltip(null);
  const handleClickPoint = (p) => {
    setTooltip((t) =>
      t && t.visitor._id === p.visitor._id
        ? null
        : {
            x: (svgRef.current?.getBoundingClientRect().left || 0) + p.cx,
            y: (svgRef.current?.getBoundingClientRect().top || 0) + p.cy,
            visitor: p.visitor,
          }
    );
  };

  // New: calculate totals with IP filtering
  const filteredVisitors = visitors.filter((v) => v.ip && v.ip.trim() !== "");

  const totalVisits = filteredVisitors.length;
  const uniqueVisitors = new Set(filteredVisitors.map((v) => v.ip)).size;
  const repeatRate =
    totalVisits > 0 ? ((1 - uniqueVisitors / totalVisits) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🗺 Visitor Map</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/visitors/graphs")}
            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
          >
            Back to Graphs
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700"
          >
            Back to Table
          </button>
        </div>
      </div>

      {/* Counts */}
      <div className="mb-4 flex gap-6 text-sm text-gray-700 bg-white p-3 rounded shadow">
        <div>
          <span className="font-semibold">Total Visits:</span> {totalVisits}
        </div>
        <div>
          <span className="font-semibold">Unique Visitors:</span>{" "}
          {uniqueVisitors}
        </div>
        <div className="text-gray-500">Repeat Rate: {repeatRate}%</div>
      </div>

      {loading ? (
        <div className="p-6 bg-white rounded shadow text-gray-600">
          Loading map...
        </div>
      ) : error ? (
        <div className="p-6 bg-white rounded shadow text-red-600">
          Error: {error}
        </div>
      ) : visitors.length === 0 ? (
        <div className="p-6 bg-white rounded shadow text-gray-600">
          No visitor coordinates available.
        </div>
      ) : (
        <div className="bg-white rounded shadow p-4">
          <div className="mb-3 text-sm text-gray-600">
            Points colored by device. Hover or click a dot for details.
          </div>

          <div style={{ position: "relative" }}>
            <svg
              ref={svgRef}
              width={size.width}
              height={size.height}
              style={{ display: "block", margin: "0 auto" }}
            >
              <g>
                {countries.map((c, i) => (
                  <path
                    key={i}
                    d={path(c)}
                    fill="#e6eef6"
                    stroke="#cbd5e1"
                    strokeWidth={0.4}
                  />
                ))}
                {pointsScreen.map((p) => (
                  <circle
                    key={p.id}
                    cx={p.cx}
                    cy={p.cy}
                    r={4.5}
                    fill={p.color}
                    stroke="#fff"
                    strokeWidth={0.8}
                    style={{ cursor: "pointer", opacity: 0.95 }}
                    onMouseEnter={(e) => handleMouseEnter(e, p)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClickPoint(p)}
                  />
                ))}
              </g>
            </svg>

            {tooltip && tooltip.visitor && (
              <div
                className="absolute z-50 pointer-events-none"
                style={{
                  left: tooltip.x + 12,
                  top: tooltip.y - 60,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="bg-white border rounded shadow p-2 text-xs text-gray-800 max-w-xs pointer-events-auto">
                  <div className="font-medium">
                    {tooltip.visitor.city || "Unknown city"},{" "}
                    {tooltip.visitor.country || "Unknown"}
                  </div>
                  <div className="text-gray-500 text-xs">
                    IP: {tooltip.visitor.ip}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Device: {tooltip.visitor.deviceType}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Page:{" "}
                    <a
                      className="text-blue-600 underline"
                      href={tooltip.visitor.page}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {new Date(tooltip.visitor.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-4 items-center text-sm">
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 12,
                  height: 12,
                  background: DEVICE_COLORS.mobile,
                }}
                className="inline-block rounded"
              />{" "}
              Mobile
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 12,
                  height: 12,
                  background: DEVICE_COLORS.tablet,
                }}
                className="inline-block rounded"
              />{" "}
              Tablet
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 12,
                  height: 12,
                  background: DEVICE_COLORS.desktop,
                }}
                className="inline-block rounded"
              />{" "}
              Desktop
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 12,
                  height: 12,
                  background: DEVICE_COLORS.unknown,
                }}
                className="inline-block rounded"
              />{" "}
              Other
            </div>
            <div className="ml-auto text-xs text-gray-500">
              Total plotted: {visitors.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
