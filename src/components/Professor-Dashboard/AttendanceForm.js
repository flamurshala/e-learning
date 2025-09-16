import { useEffect, useState } from "react";
import SessionTimer from "./SessionTimer";

function AttendanceForm({ session, professorId, courseId }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [locked, setLocked] = useState(false); // lock only when timer finishes
  const [seconds, setSeconds] = useState(0);
  const [autoMarkedStudents, setAutoMarkedStudents] = useState([]);
  const [canComplete, setCanComplete] = useState(false);

  // Display name for the session
  const sessionDisplayName =
    (session?.session_title && String(session.session_title).trim()) ||
    `Session ${session?.session_number ?? ""}`;

  useEffect(() => {
    document.title = `Attendance – ${sessionDisplayName} - Tectigon Academy`;
  }, [sessionDisplayName]);

  // Load enrolled students
  useEffect(() => {
    if (!courseId) return;

    fetch(`${process.env.REACT_APP_API_URL}/enrolled_students.php?course_id=${courseId}`)
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

  // Load existing attendance (if submitted before) — DO NOT lock here
  useEffect(() => {
    if (!session?.id || !courseId || !professorId) return;

    fetch(
      `${process.env.REACT_APP_API_URL}/get_attendance_by_session.php?session_id=${session.id}&professor_id=${professorId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const saved = {};
          data.forEach((item) => {
            saved[item.student_id] = item.status;
          });
          setAttendance(saved);
        }
      })
      .catch((err) => console.error("Error loading attendance:", err));
  }, [session?.id, courseId, professorId]);

  // Check if course can be completed
  useEffect(() => {
    if (!courseId) return;
    fetch(`${process.env.REACT_APP_API_URL}/can_complete_course.php?course_id=${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        setCanComplete(data.canComplete);
      });
  }, [courseId]);

  const updateAttendance = (studentId, status) => {
    if (locked) return; // prevent edits only when timer finished
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  // When the timer hits the cutoff, auto-mark and lock the form
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
    setLocked(true); // lock only here (timer finished)
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

    const payload = {
      session_id: session.id,
      professor_id: parseInt(professorId),
      submitted_after_seconds: seconds,
      attendance: Object.entries(attendance).map(([student_id, status]) => ({
        student_id: parseInt(student_id),
        status,
        auto_marked: autoMarkedStudents.includes(parseInt(student_id)) ? 1 : 0,
      })),
    };

    const res = await fetch(`${process.env.REACT_APP_API_URL}/attendance.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      alert("Attendance saved.");
      // Do NOT lock here — fields remain editable until the timer finishes
    } else {
      alert("Error saving attendance: " + (result.error || "Unknown"));
    }
  };

  const completeCourse = async () => {
    if (!window.confirm("Are you sure you want to complete this course?")) return;

    const res = await fetch(`${process.env.REACT_APP_API_URL}/complete_course.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId }),
    });
    const result = await res.json();

    if (result.success) {
      alert("Course marked as completed!");
      setCanComplete(false);
    } else {
      alert("Failed to complete course: " + (result.error || "Unknown error"));
    }
  };

  // ✅ Helper: build "Name Surname" with safe fallbacks
  const displayStudentName = (s) => {
    // if an API already returns full name as student_name, prefer it
    const fullFromApi = s.student_name && String(s.student_name).trim();
    if (fullFromApi) return fullFromApi;

    const first = s.name && String(s.name).trim();
    const last = s.surname && String(s.surname).trim();
    const full = [first, last].filter(Boolean).join(" ");
    return full || `Student #${s.student_id}`;
  };

  return (
    <div className="border p-6 rounded-lg bg-white shadow">
      <h2 className="text-2xl font-semibold mb-4">
        Attendance – {sessionDisplayName}
      </h2>

      <SessionTimer
        sessionId={session.id}
        onFifteenMinutes={handleFifteenMinutes}
        onTick={setSeconds}
      />

      <form onSubmit={handleSubmit}>
        {students.map((student) => (
          <div key={student.student_id} className="flex justify-between items-center mb-3">
            <span>{displayStudentName(student)}</span>
            <select
              value={attendance[student.student_id] || ""}
              onChange={(e) => updateAttendance(student.student_id, e.target.value)}
              disabled={locked}  // locked only after timer callback
              className="border rounded p-1"
            >
              <option value="">Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="online">Online</option>
            </select>
          </div>
        ))}
        {/* Submit is always active */}
        <button
          type="submit"
          className="mt-4 px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-800"
        >
          Submit Attendance
        </button>
      </form>

      <div className="mt-6 text-center"></div>
    </div>
  );
}

export default AttendanceForm;
