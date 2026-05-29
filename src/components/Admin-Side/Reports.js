import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminNav from "./AdminNav";

const REPORT_SECTIONS = [
  { value: "", label: "All Reports" },
  { value: "students", label: "Students" },
  { value: "payments", label: "Payments" },
  { value: "expenses", label: "Expenses" },
  { value: "teacher_salaries", label: "Teacher Salaries" },
  { value: "invoices", label: "Invoices" },
  { value: "payment_verifications", label: "Payment verifications" },
  { value: "waitlist", label: "Waitlist" },
  { value: "courses", label: "Courses" },
  { value: "admins", label: "Admins" },
  { value: "professors", label: "Professors" },
  { value: "certificates", label: "Certificates" },
];

export default function Reports() {
  const [logs, setLogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    actor_id: "",
    date_from: "",
    date_to: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    document.title = "Reports - Tectigon Academy";
  }, []);

  useEffect(() => {
    setMessage({ text: "", type: "" });
    axios
      .get(`${process.env.REACT_APP_API_URL}/get_reports.php${queryString ? `?${queryString}` : ""}`)
      .then((res) => {
        if (res.data?.success === false) {
          setLogs([]);
          setMessage({ text: res.data.error || "Could not load reports.", type: "error" });
          return;
        }
        setLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
        setAdmins(Array.isArray(res.data?.admins) ? res.data.admins : []);
      })
      .catch(() => {
        setLogs([]);
        setMessage({ text: "Could not load reports.", type: "error" });
      });
  }, [queryString]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: "", actor_id: "", date_from: "", date_to: "" });
  };

  const selectedSection = REPORT_SECTIONS.find((section) => section.value === filters.category);

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="ml-[22%] mt-6 w-[75%] pb-10">
        <div className="mb-4 flex items-center justify-between border-b-2 border-[#c2c2c2] pb-2">
          <h1 className="text-2xl font-semibold">Reports</h1>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded border border-[#152259] px-4 py-2 text-[#152259] hover:bg-[#eef2ff]"
          >
            Clear Filters
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="font-medium">
            Report Section
            <select
              value={filters.category}
              onChange={(e) => updateFilter("category", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              {REPORT_SECTIONS.map((section) => (
                <option key={section.value || "all"} value={section.value}>
                  {section.label}
                </option>
              ))}
            </select>
          </label>

          <label className="font-medium">
            User
            <select
              value={filters.actor_id}
              onChange={(e) => updateFilter("actor_id", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="">All users</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.username} ({admin.role})
                </option>
              ))}
            </select>
          </label>

          <label className="font-medium">
            From
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => updateFilter("date_from", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>

          <label className="font-medium">
            To
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => updateFilter("date_to", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {REPORT_SECTIONS.map((section) => (
            <button
              key={section.value || "all-tab"}
              type="button"
              onClick={() => updateFilter("category", section.value)}
              className={`rounded border px-3 py-1 text-sm ${
                filters.category === section.value
                  ? "border-[#152259] bg-[#152259] text-white"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {message.text && (
          <p className={message.type === "success" ? "mb-4 text-green-600" : "mb-4 text-red-600"}>
            {message.text}
          </p>
        )}

        <h2 className="mb-3 text-xl font-semibold">
          {selectedSection?.label || "All Reports"}
        </h2>

        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">User</th>
              <th className="border p-2 text-left">Section</th>
              <th className="border p-2 text-left">Action</th>
              <th className="border p-2 text-left">Target</th>
              <th className="border p-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="border p-2 whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                  </td>
                  <td className="border p-2">
                    {log.actor_username || "Unknown"}
                    {log.actor_role ? ` (${log.actor_role})` : ""}
                  </td>
                  <td className="border p-2">{log.category}</td>
                  <td className="border p-2">{log.action}</td>
                  <td className="border p-2">{log.entity_label || log.entity_type || "-"}</td>
                  <td className="border p-2">{log.description || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No report records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
