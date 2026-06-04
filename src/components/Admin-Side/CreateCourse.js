import { useState, useEffect } from "react";
import AdminNav from "./AdminNav";
import { getCurrentAdminActor } from "../../utils/currentAdmin";

function CreateCourse() {
  useEffect(() => {
    document.title = "Create Course - Tectigon Academy";
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [professors, setProfessors] = useState([]);
  const [selectedProfessorIds, setSelectedProfessorIds] = useState([]);
  const [trainingHours, setTrainingHours] = useState("");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/get_professors.php`)
      .then((res) => res.json())
      .then(setProfessors)
      .catch((err) => console.error("Error fetching professors:", err));
  }, []);

  const handleProfessorCheckboxChange = (e) => {
    const id = e.target.value;
    if (e.target.checked) {
      setSelectedProfessorIds((prev) => [...prev, id]);
    } else {
      setSelectedProfessorIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || selectedProfessorIds.length === 0) {
      alert("Please enter course title and select at least one professor.");
      return;
    }

    const payload = {
      title,
      description,
      professor_id: selectedProfessorIds[0],
      professor_ids: selectedProfessorIds,
      training_hours: Number(trainingHours),
      actor: getCurrentAdminActor(),
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
          setSelectedProfessorIds([]);
          setTrainingHours("");
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

          <div>
            <p className="font-semibold mb-2">Select Professors:</p>
            <div className="max-h-48 overflow-auto border border-gray-300 rounded p-2">
              {professors.length > 0 ? (
                professors.map((prof) => (
                  <label key={prof.id} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      value={String(prof.id)}
                      checked={selectedProfessorIds.includes(String(prof.id))}
                      onChange={handleProfessorCheckboxChange}
                    />
                    <span>{prof.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">No professors found.</p>
              )}
            </div>
          </div>

          <input
            type="number"
            placeholder="Number of training hours 3 sessions are added automatically "
            value={trainingHours}
            min={1}
            onChange={(e) => setTrainingHours(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />

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
