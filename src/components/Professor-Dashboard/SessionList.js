import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProffesorNav from "./ProffesorNav";
import Footer from "../Footer";

function SessionList({ professorId }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [submittedSessions, setSubmittedSessions] = useState([]);
  const [canCompleteCourse, setCanCompleteCourse] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!professorId) return;
    fetch(
      `${process.env.REACT_APP_API_URL}/get_professor_courses.php?professor_id=${professorId}`
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
      setSubmittedSessions([]);
      setCanCompleteCourse(false);
      return;
    }

    Promise.all([
      fetch(
        `${process.env.REACT_APP_API_URL}/sessions.php?course_id=${selectedCourseId}`
      ).then((res) => res.json()),
      fetch(
        `${process.env.REACT_APP_API_URL}/get_submitted_sessions.php?professor_id=${professorId}&course_id=${selectedCourseId}`
      ).then((res) => res.json()),
    ])
      .then(([sessionData, submittedData]) => {
        if (Array.isArray(sessionData)) setSessions(sessionData);
        if (Array.isArray(submittedData)) {
          const sessionIds = submittedData.map((item) => item.session_id);
          setSubmittedSessions(sessionIds);

          const totalSessions = sessionData.length;
          const totalSubmitted = sessionIds.length;

          const canComplete =
            totalSessions >= 3 && totalSubmitted >= totalSessions - 2;

          setCanCompleteCourse(canComplete);
        }
      })
      .catch((err) =>
        console.error("Failed to fetch sessions or submissions:", err)
      );
  }, [selectedCourseId, professorId]);

  const handleSessionClick = (session) => {
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

  const completeCourse = async () => {
    if (
      !window.confirm("Are you sure you want to mark this course as complete?")
    )
      return;

    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/complete_course.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: selectedCourseId }),
      }
    );

    const result = await res.json();

    if (result.success) {
      alert("Course marked as completed!");
      setCanCompleteCourse(false);
    } else {
      alert("Failed to complete course: " + (result.error || "Unknown"));
    }
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

        {selectedCourseId && (
          <div className="mt-6 text-center">
            <button
              onClick={completeCourse}
              disabled={!canCompleteCourse}
              className={`px-4 py-2 rounded text-white mt-2 ${
                canCompleteCourse
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Complete Course
            </button>
          </div>
        )}

        <div className="mt-[30%]">
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default SessionList;
