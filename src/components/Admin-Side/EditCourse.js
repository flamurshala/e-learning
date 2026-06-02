import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";

function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState({
    title: "",
    description: "",
    professor_ids: [],
    training_hours: "",
  });

  const [professors, setProfessors] = useState([]);
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
          professor_ids:
            data.professor_ids?.map(String) ||
            (data.professor_id ? [String(data.professor_id)] : []),
          training_hours: data.training_hours || "",
        });
        setOriginalTrainingHours(Number(data.training_hours) || 0); // 🆕
      });

    // Get all professors
    fetch(`${process.env.REACT_APP_API_URL}/get_professors.php`)
      .then((res) => res.json())
      .then(setProfessors);
  }, [id]);

  const handleChange = (e) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
  };

  const handleProfessorCheckboxChange = (e) => {
    const professorId = e.target.value;
    const checked = e.target.checked;

    setCourse((prev) => ({
      ...prev,
      professor_ids: checked
        ? [...prev.professor_ids, professorId]
        : prev.professor_ids.filter((pid) => pid !== professorId),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newHours = Number(course.training_hours);

    if (course.professor_ids.length === 0) {
      alert("Please select at least one professor.");
      return;
    }

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
      body: JSON.stringify({
        ...course,
        id,
        professor_id: course.professor_ids[0],
      }),
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

          <div>
            <p className="font-semibold mb-2">Select Professors:</p>
            <div className="max-h-48 overflow-y-auto border p-2 rounded">
              {professors.length > 0 ? (
                professors.map((prof) => (
                  <label key={prof.id} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      value={String(prof.id)}
                      checked={course.professor_ids.includes(String(prof.id))}
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
            name="training_hours"
            value={course.training_hours}
            onChange={handleChange}
            placeholder="Training Hours"
            min={1}
            className="w-full border p-2 rounded"
          />
          <label className="text-gray-400">(Add 3 extra hours for informative session and the extra 2 at the end)</label>

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
