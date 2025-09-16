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
    fetch(`${process.env.REACT_APP_API_URL}/get_professor_courses.php?professor_id=${professorId}`)
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
      fetch(`${process.env.REACT_APP_API_URL}/sessions.php?course_id=${selectedCourseId}`).then((res) => res.json()),
      fetch(
        `${process.env.REACT_APP_API_URL}/get_submitted_sessions.php?professor_id=${professorId}&course_id=${selectedCourseId}`
      ).then((res) => res.json()),
    ])
      .then(([sessionData, submittedData]) => {
        if (Array.isArray(sessionData)) setSessions(sessionData);
        if (Array.isArray(submittedData)) {
          const sessionIds = submittedData.map((item) => item.session_id);
          setSubmittedSessions(sessionIds);

          const totalSessions = Array.isArray(sessionData) ? sessionData.length : 0;
          const totalSubmitted = sessionIds.length;

          // Can complete if at least 3 sessions total and all except last 2 submitted
          const canComplete = totalSessions >= 3 && totalSubmitted >= totalSessions - 2;
          setCanCompleteCourse(canComplete);
        }
      })
      .catch((err) => console.error("Failed to fetch sessions or submissions:", err));
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

  const isSessionSubmitted = (sessionId) => submittedSessions.includes(sessionId);

  const completeCourse = async () => {
    if (!window.confirm("Are you sure you want to mark this course as complete?")) return;

    const res = await fetch(`${process.env.REACT_APP_API_URL}/complete_course.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: selectedCourseId }),
    });

    const result = await res.json();

    if (result.success) {
      alert("Course marked as completed!");
      setCanCompleteCourse(false);
    } else {
      alert("Failed to complete course: " + (result.error || "Unknown"));
    }
  };

  const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  return (
    <div className="flex gap-2">
      <ProffesorNav />
      <div className="w-[75%] mt-7 ml-[22%]">
        <h1 className="text-2xl font-bold mb-4">Attendance</h1>

        {/* ===== Course cards (replaces dropdown) ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {courses.length === 0 && (
            <div className="text-gray-500">No courses assigned to your account.</div>
          )}
          {courses.map((course) => {
            const selected = String(selectedCourseId) === String(course.id);
            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(String(course.id))}
                className={`text-left border rounded-xl p-4 shadow-sm transition
                  ${selected ? "ring-2 ring-blue-600 bg-blue-50" : "hover:shadow-md hover:bg-gray-50"}`}
              >
                <h3 className="font-semibold">{course.title}</h3>
                {selected && (
                  <span className="mt-2 inline-block text-[11px] font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ===== Sessions list ===== */}
        {!selectedCourseId ? (
          <p className="text-gray-600">Select a course to view its sessions.</p>
        ) : (
          <>
            {selectedCourse && (
              <h2 className="text-lg font-semibold mb-3">
                Course: <span className="font-normal">{selectedCourse.title}</span>
              </h2>
            )}

            <ul className="flex flex-wrap gap-2">
              {sessions.map((session) => {
                const submitted = isSessionSubmitted(session.id);
                // ✅ If name exists, show it; else show "Session {number}"
                const label =
                  (session.session_title && String(session.session_title).trim()) ||
                  `Session ${session.session_number}`;

                return (
                  <li
                    key={session.id}
                    className={`mb-2 p-3 border rounded transition ${
                      submitted
                        ? "bg-gray-300 cursor-pointer hover:bg-gray-300"
                        : "hover:bg-gray-100 cursor-pointer"
                    }`}
                    onClick={() => handleSessionClick(session)}
                    title={submitted ? "Attendance already submitted" : "Click to submit attendance"}
                  >
                    {label}
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 text-center">
              <button
                onClick={completeCourse}
                disabled={!canCompleteCourse || !selectedCourseId}
                className={`px-4 py-2 rounded text-white mt-2 ${
                  canCompleteCourse ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Complete Course
              </button>
            </div>
          </>
        )}

        <div className="mt-[30%]">
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default SessionList;
