import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProffesorNav from "./ProffesorNav";
import Footer from "../Footer";

function SessionList({ professorId }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [submittedSessions, setSubmittedSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!professorId) return;
    fetch(
      `http://localhost/e-learning/backend/get_professor_courses.php?professor_id=${professorId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data);
      })
      .catch((err) => console.error("Failed to load courses:", err));
  }, [professorId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setSessions([]);
      return;
    }

    fetch(
      `http://localhost/e-learning/backend/sessions.php?course_id=${selectedCourseId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSessions(data);
      })
      .catch((err) => console.error("Failed to load sessions:", err));

    // Fetch submitted session ids
    fetch(
      `http://localhost/e-learning/backend/get_submitted_sessions.php?professor_id=${professorId}&course_id=${selectedCourseId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sessionIds = data.map((item) => item.session_id); // 🟢 extract session IDs
          setSubmittedSessions(sessionIds);
        }
      })

      .catch((err) =>
        console.error("Failed to fetch submitted sessions:", err)
      );
  }, [selectedCourseId, professorId]);

  const handleSessionClick = (session) => {
    // if (isSessionSubmitted(session.id)) return; // Prevent click if already submitted
    navigate("/professor/attendance", {
      state: {
        session,
        courseId: selectedCourseId,
        professorId,
      },
    });
  };

  const isSessionSubmitted = (sessionId) => {
    return submittedSessions.includes(sessionId);
  };

  return (
    <div className="flex gap-2">
      <ProffesorNav />
      <div className="w-[75%] mt-7 ml-[22%]">
        <h1 className="text-2xl font-bold mb-4">Attendance</h1>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="border p-2 rounded mb-4"
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>

        <ul className="flex flex-wrap gap-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className={`mb-2 p-2 border rounded ${
                isSessionSubmitted(session.id)
                  ? "cursor-pointer bg-gray-300 hover:bg-gray-300"
                  : "cursor-pointer hover:bg-gray-100"
              }`}
              onClick={() => handleSessionClick(session)}
              title={
                isSessionSubmitted(session.id)
                  ? "Attendance already submitted"
                  : "Click to submit attendance"
              }
            >
              Session {session.session_number}
            </li>
          ))}
        </ul>
        <div className="mt-[30%]">
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default SessionList;
