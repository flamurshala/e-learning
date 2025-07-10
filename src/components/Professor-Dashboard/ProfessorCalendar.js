import { useState } from "react";
import SessionList from "./SessionList";
import AttendanceForm from "./AttendanceForm";

function ProfessorCalendar() {
  const [selectedSession, setSelectedSession] = useState(null);

  const professorId = localStorage.getItem("professorId");

  return (
    <div>
      <SessionList professorId={professorId} onSelect={setSelectedSession} />
      {selectedSession && (
        <AttendanceForm
          session={selectedSession}
          courseId={selectedSession.course_id}
          professorId={professorId}
        />
      )}
    </div>
  );
}

export default ProfessorCalendar;
