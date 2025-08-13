import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function NumberLead() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(
        "https://api.loopandcut.in/api/customer/all/user_lead"
      );

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();

      if (data.status !== 200) {
        throw new Error(data.message || "Failed to fetch leads.");
      }

      setLeads(data.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong while fetching leads.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 text-blue-500 font-semibold">Loading leads...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error: {error}</p>
        <button
          onClick={fetchLeads}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded shadow">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
      >
        ← Back
      </button>
      <h2 className="text-lg font-bold mb-4">📊 Total Leads</h2>
      <p className="text-2xl font-bold text-green-600">
        Total Lead: {leads.length}
      </p>
      <div className="mt-2 flex gap-4">
        <button
          onClick={() => navigate("/visitors/graphs")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          View Graphs
        </button>
        <button
          onClick={() => navigate("/visitorsmap")}
          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
        >
          Map View
        </button>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold text-gray-700 mb-2">Lead List</h3>
        <ul className="border rounded divide-y max-h-64 overflow-y-auto">
          {leads.map((lead) => (
            <li key={lead._id} className="p-2 flex justify-between">
              <span className="font-mono">{lead.mobile_no}</span>
              <span className="text-gray-500 text-sm">
                {new Date(lead.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
