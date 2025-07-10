import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProffesorNav from "./ProffesorNav";
import Footer from "../Footer";

function SessionList({ professorId }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [sessions, setSessions] = useState([]);
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
  }, [selectedCourseId]);

  const handleSessionClick = (session) => {
    navigate("/professor/attendance", {
      state: {
        session,
        courseId: selectedCourseId,
        professorId,
      },
    });
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
              className="cursor-pointer mb-2 p-2 border rounded hover:bg-gray-100"
              onClick={() => handleSessionClick(session)}
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
