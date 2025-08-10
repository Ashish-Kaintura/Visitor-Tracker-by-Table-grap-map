// VisitorsExport.js
import React from "react";

const VisitorsExport = ({ location }) => {
  const data = location?.state?.filteredVisitors || [];

  const exportToCSV = () => {
    if (!data.length) return alert("No data to export");

    const headers = [
      "IP Address",
      "City",
      "Country",
      "Page",
      "Referrer",
      "Device",
      "Language",
      "Timestamp",
    ];

    const rows = data.map(v => [
      v.ip,
      v.city,
      v.country,
      v.page,
      v.referrer,
      v.deviceType,
      v.language,
      new Date(v.timestamp).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `visitors_export_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Export Filtered Visitors</h1>
      <button
        onClick={exportToCSV}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Download CSV
      </button>
    </div>
  );
};

export default VisitorsExport;
