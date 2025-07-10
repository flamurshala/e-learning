import { useEffect, useState } from "react";
import SessionTimer from "./SessionTimer";

function AttendanceForm({ session, professorId, courseId }) {
  useEffect(() => {
    document.title = "Attendance - Tectigon Academy";
  }, []);

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [locked, setLocked] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [autoMarkedStudents, setAutoMarkedStudents] = useState([]);

  const [canComplete, setCanComplete] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    fetch(
      `http://localhost/e-learning/backend/enrolled_students.php?course_id=${courseId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStudents(data);
        } else {
          console.error("Invalid students data:", data);
          setStudents([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch students:", err);
        setStudents([]);
      });
  }, [courseId]);

  // ✅ Hook to check if course can be completed
  useEffect(() => {
    if (!courseId) return;
    fetch(
      `http://localhost/e-learning/backend/can_complete_course.php?course_id=${courseId}`
    )
      .then((res) => res.json())
      .then((data) => {
        setCanComplete(data.canComplete);
      });
  }, [courseId]);

  const updateAttendance = (studentId, status) => {
    if (locked) return;
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleFifteenMinutes = () => {
    const autoMarked = {};
    const autoMarkedIds = [];

    students.forEach((s) => {
      if (!attendance[s.student_id]) {
        autoMarked[s.student_id] = "absent";
        autoMarkedIds.push(s.student_id);
      } else {
        autoMarked[s.student_id] = attendance[s.student_id];
      }
    });

    setAttendance(autoMarked);
    setAutoMarkedStudents(autoMarkedIds);
    setLocked(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missing = students.filter((s) => !attendance[s.student_id]);

    if (
      missing.length > 0 &&
      !window.confirm(
        `You haven't marked ${missing.length} student(s). Do you want to submit anyway?`
      )
    )
      return;

    const data = {
      session_id: session.id,
      professor_id: parseInt(professorId),
      submitted_after_seconds: seconds,
      attendance: Object.entries(attendance).map(([student_id, status]) => ({
        student_id: parseInt(student_id),
        status,
        auto_marked: autoMarkedStudents.includes(parseInt(student_id)) ? 1 : 0,
      })),
    };

    const res = await fetch(
      "http://localhost/e-learning/backend/attendance.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    const result = await res.json();
    if (res.ok && result.success) {
      alert("Attendance saved.");
    } else {
      alert("Error saving attendance: " + (result.error || "Unknown"));
    }
  };

  const completeCourse = async () => {
    if (!window.confirm("Are you sure you want to complete this course?"))
      return;
    const res = await fetch(
      "http://localhost/e-learning/backend/complete_course.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId }),
      }
    );
    const result = await res.json();
    if (result.success) {
      alert("Course marked as completed!");
      setCanComplete(false);
    } else {
      alert("Failed to complete course: " + (result.error || "Unknown error"));
    }
  };

  return (
    <div className="border p-6 rounded-lg bg-white shadow">
      <h2 className="text-2xl font-semibold mb-4">
        Attendance – Session {session.session_number}
      </h2>

      <SessionTimer
        onFifteenMinutes={handleFifteenMinutes}
        onSecondsChange={setSeconds}
      />

      <form onSubmit={handleSubmit}>
        {students.map((student) => (
          <div
            key={student.student_id}
            className="flex justify-between items-center mb-3"
          >
            <span>{student.name}</span>
            <select
              value={attendance[student.student_id] || ""}
              onChange={(e) =>
                updateAttendance(student.student_id, e.target.value)
              }
              disabled={locked}
              className="border rounded p-1"
            >
              <option value="">Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="online">Online</option>
            </select>
          </div>
        ))}
        <button
          type="submit"
          className="mt-4 bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded"
        >
          Submit Attendance
        </button>
      </form>

      {/* ✅ Complete Course Button */}
      <div className="mt-6 text-center">
        <button
          onClick={completeCourse}
          disabled={!canComplete}
          className={`px-4 py-2 rounded text-white mt-2 ${
            canComplete
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Complete Course
        </button>
      </div>
    </div>
  );
}

export default AttendanceForm;
