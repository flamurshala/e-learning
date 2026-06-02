import { useEffect, useMemo, useState } from "react";
import AdminNav from "./AdminNav";

export default function CanceledStudents() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    document.title = "Canceled Students - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_canceled_students.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setRows([]);
          setError(data.error);
        } else {
          setRows(Array.isArray(data) ? data : []);
          setError("");
        }
      })
      .catch(() => {
        setRows([]);
        setError("Could not load canceled students.");
      })
      .finally(() => setLoading(false));
  }, []);

  const courses = useMemo(() => {
    const values = new Map();
    rows.forEach((row) => {
      if (row.course_id && row.course_title) {
        values.set(String(row.course_id), row.course_title);
      }
    });
    return Array.from(values, ([id, title]) => ({ id, title }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const fullName = `${row.name || ""} ${row.surname || ""}`.toLowerCase();
      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        String(row.email || "").toLowerCase().includes(query) ||
        String(row.phone_number || "").toLowerCase().includes(query);
      const matchesCourse = !courseFilter || String(row.course_id || "") === courseFilter;
      return matchesSearch && matchesCourse;
    });
  }, [rows, search, courseFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, courseFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const generateCsv = () => {
    const link = document.createElement("a");
    link.href = `${process.env.REACT_APP_API_URL}/export_canceled_students_csv.php`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%] pb-10">
        <div className="mb-6 flex items-center justify-between border-b-2 border-[#c2c2c2] pb-2">
          <h1 className="text-2xl font-semibold">Canceled Students</h1>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Filter by course</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="min-w-[220px] rounded border px-3 py-2"
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, or phone"
              className="min-w-[260px] rounded border px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={generateCsv}
            className="rounded bg-[#152259] px-4 py-2 text-white hover:bg-[#152239]"
          >
            Generate CSV
          </button>
        </div>

        {loading ? (
          <p>Loading canceled students...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-300">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">Phone</th>
                  <th className="border p-2 text-left">Course</th>
                  <th className="border p-2 text-left">Amount</th>
                  <th className="border p-2 text-left">Note</th>
                  <th className="border p-2 text-left">Canceled At</th>
                  <th className="border p-2 text-left">Canceled By</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">
                      No canceled students found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="border p-2">
                        {[row.name, row.surname].filter(Boolean).join(" ")}
                      </td>
                      <td className="border p-2">{row.email}</td>
                      <td className="border p-2">{row.phone_number}</td>
                      <td className="border p-2">{row.course_title || "-"}</td>
                      <td className="border p-2">
                        {row.amount_to_pay !== null &&
                        row.amount_to_pay !== undefined &&
                        row.amount_to_pay !== ""
                          ? `${Number(row.amount_to_pay).toFixed(2)} EUR`
                          : "-"}
                      </td>
                      <td className="max-w-[220px] whitespace-pre-wrap border p-2">
                        {row.extra_note || "-"}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {row.canceled_at ? new Date(row.canceled_at).toLocaleString() : "-"}
                      </td>
                      <td className="border p-2">{row.canceled_by_username || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredRows.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t bg-white px-3 py-3 text-sm">
                <span>
                  Showing {(currentPage - 1) * rowsPerPage + 1}-
                  {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
