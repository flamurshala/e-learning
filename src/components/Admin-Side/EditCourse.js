import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import { color } from "framer-motion";

function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState({
    title: "",
    description: "",
    professor_id: "",
    training_hours: "",
    student_ids: [],
  });

  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [originalTrainingHours, setOriginalTrainingHours] = useState(0); // 🆕

  useEffect(() => {
    document.title = "Edit Course - Tectigon Academy";

    // Get course details
    fetch(`${process.env.REACT_APP_API_URL}/get_course.php?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse({
          title: data.title,
          description: data.description,
          professor_id: data.professor_id,
          training_hours: data.training_hours || "",
          student_ids: data.student_ids?.map(String) || [],
        });
        setOriginalTrainingHours(Number(data.training_hours) || 0); // 🆕
      });

    // Get all professors
    fetch(`${process.env.REACT_APP_API_URL}/get_professors.php`)
      .then((res) => res.json())
      .then(setProfessors);

    // Get all students
    fetch(`${process.env.REACT_APP_API_URL}/get_students.php`)
      .then((res) => res.json())
      .then(setStudents);
  }, [id]);

  const handleChange = (e) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
  };

  const handleStudentCheckboxChange = (e) => {
    const id = e.target.value;
    const checked = e.target.checked;

    setCourse((prev) => ({
      ...prev,
      student_ids: checked
        ? [...prev.student_ids, id]
        : prev.student_ids.filter((sid) => sid !== id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newHours = Number(course.training_hours);

    // If reducing session count, show a warning
    if (newHours < originalTrainingHours) {
      const confirmed = window.confirm(
        `You are reducing the training sessions from ${originalTrainingHours} to ${newHours}. ` +
          `This will permanently delete the last ${originalTrainingHours - newHours} session(s). ` +
          `Are you sure you want to proceed?`
      );
      if (!confirmed) return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/update_course.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...course, id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Course updated!");
          navigate("/AllCourses");
        } else {
          alert("Failed to update course.");
        }
      });
  };

  // 🔧 Now searches by name, surname, and "name surname"
  const filteredStudents = students.filter((s) => {
    const name = (s.name || "").toLowerCase();
    const surname = (s.surname || "").toLowerCase();
    const full = `${name} ${surname}`.trim();
    const term = (searchTerm || "").toLowerCase();
    return name.includes(term) || surname.includes(term) || full.includes(term);
  });

  return (
    <div className="flex gap-5">
      <AdminNav />
      <div className="w-[75%] ml-[22%] mt-6">
        <div className="flex justify-between w-full mb-4">
          <h1 className="text-2xl font-bold">Edit Course</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#152259] text-white px-4 py-2 rounded hover:bg-[#152239]"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={course.title}
            onChange={handleChange}
            placeholder="Course Title"
            required
            className="w-full border p-2 rounded"
          />

          <textarea
            name="description"
            value={course.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full border p-2 rounded"
          ></textarea>

          <select
            name="professor_id"
            value={course.professor_id}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Select Professor --</option>
            {professors.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.name}
              </option>
            ))}
          </select>
       
            
          <input
            type="number"
            name="training_hours"
            value={course.training_hours}
            onChange={handleChange}
            placeholder="Training Hours"
            min={1}
            className="w-full border p-2 rounded"
          />
          <label className="text-gray-400">(Add 3 extra hours for informative session and the extra 2 at the end)</label>

          <div>
            <p className="font-semibold">Select Students:</p>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border p-2 mb-2 rounded"
            />

            <div className="max-h-48 overflow-y-auto border p-2 rounded">
              {filteredStudents.map((s) => {
                const label = [s.name, s.surname].filter(Boolean).join(" ");
                return (
                  <label key={s.id} className="block">
                    <input
                      type="checkbox"
                      value={s.id}
                      checked={course.student_ids.includes(String(s.id))}
                      onChange={handleStudentCheckboxChange}
                      className="mr-2"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#152259] text-white px-4 py-2 rounded hover:bg-[#152239]"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditCourse;
