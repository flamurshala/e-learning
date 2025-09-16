import { useState, useEffect } from "react";
import AdminNav from "./AdminNav";

function CreateCourse() {
  useEffect(() => {
    document.title = "Create Course - Tectigon Academy";
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [professorId, setProfessorId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [trainingHours, setTrainingHours] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/get_professors.php`)
      .then((res) => res.json())
      .then(setProfessors)
      .catch((err) => console.error("Error fetching professors:", err));

    fetch(`${process.env.REACT_APP_API_URL}/get_students.php`)
      .then((res) => res.json())
      .then(setStudents)
      .catch((err) => console.error("Error fetching students:", err));
  }, []);

  const handleStudentCheckboxChange = (e) => {
    const id = e.target.value; // keep as string for stable comparison
    if (e.target.checked) {
      setSelectedStudentIds((prev) => [...prev, id]);
    } else {
      setSelectedStudentIds((prev) => prev.filter((sid) => sid !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !professorId) {
      alert("Please enter course title and select a professor.");
      return;
    }

    const payload = {
      title,
      description,
      professor_id: professorId,
      // backend can cast to int if needed
      student_ids: selectedStudentIds,
      training_hours: Number(trainingHours),
    };

    fetch(`${process.env.REACT_APP_API_URL}/create_courses.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Course created successfully!");
          setTitle("");
          setDescription("");
          setProfessorId("");
          setSelectedStudentIds([]);
          setTrainingHours("");
          setSearchTerm("");
        } else {
          alert("Error creating course: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Error creating course:", err);
        alert("Error creating course, check console.");
      });
  };

  // 🔍 search by name OR surname
  const lcQuery = searchTerm.toLowerCase();
  const filteredStudents = students.filter((s) => {
    const full = `${s.name || ""} ${s.surname || ""}`.trim().toLowerCase();
    return full.includes(lcQuery);
  });

  // optional: sort alphabetically by full name
  filteredStudents.sort((a, b) => {
    const fa = `${a.name || ""} ${a.surname || ""}`.trim().toLowerCase();
    const fb = `${b.name || ""} ${b.surname || ""}`.trim().toLowerCase();
    return fa.localeCompare(fb);
  });

  return (
    <div className="flex gap-5 bg-white rounded shadow">
      <AdminNav />
      <div className="w-[75%] ml-[22%] mt-[2rem]">
        <h1 className="text-3xl font-bold mb-4 border-b border-black">
          Create New Course
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="WP-sep-pm-25"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />

          <textarea
            placeholder="Course Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />

          <select
            value={professorId}
            onChange={(e) => setProfessorId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          >
            <option value="">Select Professor</option>
            {professors.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Number of training hours 3 sessions are added automatically "
            value={trainingHours}
            min={1}
            onChange={(e) => setTrainingHours(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />

          <div>
            <p className="font-semibold mb-2">Select Students:</p>

            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 mb-2"
            />

            {/* Student List */}
            <div className="max-h-64 overflow-auto border border-gray-300 rounded p-2">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => {
                  const fullName = `${s.name || ""} ${s.surname || ""}`.trim();
                  return (
                    <label key={s.id} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        value={String(s.id)}
                        checked={selectedStudentIds.includes(String(s.id))}
                        onChange={handleStudentCheckboxChange}
                      />
                      <span>{fullName || "(No name)"}</span>
                    </label>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No students found.</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#152259] text-white px-4 py-2 rounded hover:bg-[#152239]"
          >
            Create Course
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateCourse;
