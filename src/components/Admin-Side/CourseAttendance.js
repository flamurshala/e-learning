import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import ProffesorNav from "../Professor-Dashboard/ProffesorNav";

function CourseAttendance() {
  const { courseId } = useParams();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Check if professor is logged in
  const isProfessor = localStorage.getItem("professorId");

  // Format any ISO/"YYYY-MM-DD HH:MM:SS" as Europe/Belgrade
  const formatBelgrade = (s) => {
    if (!s) return null;
    const hasTZ = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(s);
    const iso = hasTZ ? s : s.replace(" ", "T") + "Z"; // treat bare MySQL datetime as UTC
    const d = new Date(iso);
    if (isNaN(d)) return s;
    return new Intl.DateTimeFormat(undefined, {
      timeZone: "Europe/Belgrade",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  useEffect(() => {
    document.title = "Course Attendance - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_attendance.php?course_id=${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAttendanceData(Array.isArray(data) ? data : []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch attendance.");
        setLoading(false);
      });
  }, [courseId]);

  // Group by session_number; keep submitted_at and session_title for display
  const grouped = attendanceData.reduce((acc, r) => {
    const key = String(r.session_number);
    if (!acc[key]) {
      acc[key] = {
        records: [],
        submittedAt: r.submitted_at || null,
        sessionTitle: r.session_title || null,
      };
    }
    if (r.submitted_at) acc[key].submittedAt = r.submitted_at;
    if (r.session_title) acc[key].sessionTitle = r.session_title;
    acc[key].records.push(r);
    return acc;
  }, {});

  // 🔹 Helper to display full name with surname
  const getFullName = (row) => {
    const fromApi = row.student_name && String(row.student_name).trim(); // may already be "Name Surname"
    if (fromApi) return fromApi;
    const first = row.name ? String(row.name).trim() : "";
    const last = row.surname ? String(row.surname).trim() : "";
    const combo = [first, last].filter(Boolean).join(" ");
    return combo || `Student #${row.student_id}`;
  };

  return (
    <div className="flex gap-4">
      {/* ✅ Dynamic navigation */}
      {isProfessor ? <ProffesorNav /> : <AdminNav />}

      <div className="mt-4 ml-[22%] w-[75%]">
        <div className="flex mb-2 border-b-2 border-[#c2c2c2] pb-2 items-center justify-between">
          <h1 className="text-2xl font-semibold w-[95%]">Course Attendance</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
          >
            ←
          </button>
        </div>

        {loading && <p className="mt-4">Loading attendance...</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        {!loading && !error && Object.keys(grouped).length === 0 && (
          <p className="mt-4">No attendance records found.</p>
        )}

        {!loading && !error && (
          <>
            {Object.entries(grouped).map(([sessionNumber, { records, submittedAt, sessionTitle }]) => {
              const displayName =
                (sessionTitle && String(sessionTitle).trim()) || `Session ${sessionNumber}`;
              return (
                <div key={sessionNumber} className="mb-6">
                  <h3 className="font-semibold mb-1">{displayName}</h3>

                  <p className={`mb-2 ${submittedAt ? "text-gray-600" : "text-red-600 italic"}`}>
                    {submittedAt ? `📅 ${formatBelgrade(submittedAt)}` : "Not submitted yet"}
                  </p>

                  {records[0]?.submitted_after_seconds !== null &&
                  records[0]?.submitted_after_seconds !== undefined ? (
                    <p className="italic text-gray-600 mb-2">
                      Submitted {Math.floor(records[0].submitted_after_seconds / 60)} minutes after
                      session started
                    </p>
                  ) : (
                    <p className="italic text-gray-500 mb-2">—</p>
                  )}

                  <table className="w-full border border-collapse border-gray-300 text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-2 border">Student</th>
                        <th className="p-2 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={`${r.attendance_id || "no-att"}-${r.student_id || "no-st"}-${i}`}>
                          <td className="p-2 border">{getFullName(r)}</td>
                          <td className="p-2 border text-center capitalize">{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default CourseAttendance;
