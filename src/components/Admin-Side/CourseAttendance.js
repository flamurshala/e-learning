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

  useEffect(() => {
    document.title = "Course Attendance - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_attendance.php?course_id=${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAttendanceData(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch attendance.");
        setLoading(false);
      });
  }, [courseId]);

  const grouped = attendanceData.reduce((acc, record) => {
    const key = `${record.session_number} - ${record.session_date}`;
    if (!acc[key]) {
      acc[key] = {
        records: [],
        submittedAt: record.submitted_at || null,
      };
    }
    acc[key].records.push(record);
    return acc;
  }, {});

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
            {Object.entries(grouped).map(([session, { records }]) => (
              <div key={session} className="mb-6">
                <h3 className="font-semibold mb-2">Session: {session}</h3>

                {records[0].submitted_after_seconds !== null ? (
                  <p className="italic text-gray-600 mb-2">
                    Submitted{" "}
                    {Math.floor(records[0].submitted_after_seconds / 60)} minutes
                    after session started
                  </p>
                ) : (
                  <p className="italic text-red-600 mb-2">Not submitted yet</p>
                )}

                <table className="w-full border border-collapse border-gray-300 text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 border">Student</th>
                      <th className="p-2 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.attendance_id}>
                        <td className="p-2 border">{r.student_name}</td>
                        <td className="p-2 border text-center capitalize">
                          {r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default CourseAttendance;
