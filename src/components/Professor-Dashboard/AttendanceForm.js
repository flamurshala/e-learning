import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SessionTimer from "./SessionTimer";

function AttendanceForm({ session, professorId, courseId }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [locked, setLocked] = useState(false); // lock only when timer finishes
  const [seconds, setSeconds] = useState(0);
  const [autoMarkedStudents, setAutoMarkedStudents] = useState([]);

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

  const updateAttendance = (studentId, status) => {
    if (locked) return; // prevent edits only when timer finished
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const statusOptions = [
    {
      value: "present",
      label: "Prezent",
      className: "border-green-600 text-green-700 hover:bg-green-50",
      activeClassName: "bg-green-600 text-white border-green-600",
    },
    {
      value: "online",
      label: "Online",
      className: "border-blue-600 text-blue-700 hover:bg-blue-50",
      activeClassName: "bg-blue-600 text-white border-blue-600",
    },
    {
      value: "absent",
      label: "Munges",
      className: "border-red-600 text-red-700 hover:bg-red-50",
      activeClassName: "bg-red-600 text-white border-red-600",
    },
  ];

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
      navigate(`/professor/calendar/${courseId}`);
    } else {
      alert("Error saving attendance: " + (result.error || "Unknown"));
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
          <div
            key={student.student_id}
            className="flex flex-col gap-2 py-3 border-b last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-medium text-gray-800">{displayStudentName(student)}</span>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => {
                const isActive = attendance[student.student_id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateAttendance(student.student_id, option.value)}
                    disabled={locked}
                    className={`min-w-[88px] rounded border px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isActive ? option.activeClassName : option.className
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
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
