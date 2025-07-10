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

  useEffect(() => {
    fetch("http://localhost/e-learning/backend/get_professors.php")
      .then((res) => res.json())
      .then(setProfessors)
      .catch((err) => console.error("Error fetching professors:", err));

    fetch("http://localhost/e-learning/backend/get_students.php")
      .then((res) => res.json())
      .then(setStudents)
      .catch((err) => console.error("Error fetching students:", err));
  }, []);

  const handleStudentCheckboxChange = (e) => {
    const id = e.target.value;
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
      student_ids: selectedStudentIds,
      training_hours: Number(trainingHours),
    };

    fetch("http://localhost/e-learning/backend/create_courses.php", {
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
        } else {
          alert("Error creating course: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Error creating course:", err);
        alert("Error creating course, check console.");
      });
  };

  return (
    <div className=" flex gap-5  bg-white rounded shadow">
      <AdminNav />
      <div className="w-[75%] ml-[22%] mt-[2rem]">
        <h1 className="text-3xl font-bold mb-4 border-b border-black">
          Create New Course
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Course Title"
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
            placeholder="Number of training hours"
            value={trainingHours}
            min={1}
            onChange={(e) => setTrainingHours(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />

          <div>
            <p className="font-semibold mb-2">Select Students:</p>
            <div className="max-h-48 overflow-auto border border-gray-300 rounded p-2">
              {students.map((student) => (
                <label key={student.id} className="block mb-1">
                  <input
                    type="checkbox"
                    value={student.id}
                    checked={selectedStudentIds.includes(String(student.id))}
                    onChange={handleStudentCheckboxChange}
                    className="mr-2"
                  />
                  {student.name}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#0e6cff] text-white px-4 py-2 rounded hover:bg-[#255ebb]"
          >
            Create Course
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateCourse;
