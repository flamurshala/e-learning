import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AttendanceForm from "./AttendanceForm";

function ProfessorAttendancePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, courseId, professorId } = location.state || {};

  const [minutesElapsed, setMinutesElapsed] = useState(0);

  useEffect(() => {
    if (!session?.session_date) return;

    const sessionStart = new Date(session.session_date);

    const updateElapsedMinutes = () => {
      const now = new Date();
      const diffMs = now - sessionStart;
      const diffMins = Math.floor(diffMs / 60000);
      setMinutesElapsed(diffMins >= 0 ? diffMins : 0);
    };

    updateElapsedMinutes();

    const intervalId = setInterval(updateElapsedMinutes, 60000);

    return () => clearInterval(intervalId); 
  }, [session]);

  if (!session || !courseId || !professorId) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-600">
          Session data is missing.
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-900"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Session {session.session_number}
          </h1>
          <p className="text-gray-500">📅 {session.session_date}</p>

        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          ← Back to Sessions
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 border">
        <AttendanceForm
          session={session}
          courseId={courseId}
          professorId={professorId}
          minutesElapsed={minutesElapsed} 
        />
      </div>
    </div>
  );
}

export default ProfessorAttendancePage;
