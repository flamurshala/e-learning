import AdminNav from "./AdminNav";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function EditStudent() {
  useEffect(() => {
    document.title = "Edit Student - Tectigon Academy";
  }, []);

  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/get_single_student.php?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success === false) {
          alert("Student not found");
          navigate("/AllStudents");
          return;
        }
        setStudent({
          name: data.name || "",
          phone: data.phone_number || "",
          email: data.email || "",
          password: data.password || "",
        });
      })
      .catch((err) => {
        console.error("Failed to load student", err);
        alert("Failed to load student data");
      });
  }, [id, navigate]);

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${process.env.REACT_APP_API_URL}/update_student.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...student }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Update response:", data);
        if (data.success) {
          navigate("/AllStudents");
        } else {
          alert("Update failed: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => {
        alert("Fetch error: " + err.message);
      });
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="w-[30%] ml-[22%] mt-8">
        <div className="flex  items-center justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4">Edit Student</h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
          >
            ←
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={student.name}
            onChange={handleChange}
            placeholder="Name"
            className="block border p-2 w-full"
            required
          />
          <input
            name="phone"
            value={student.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="block border p-2 w-full"
            required
          />
          <input
            name="email"
            value={student.email}
            onChange={handleChange}
            placeholder="Email"
            className="block border p-2 w-full"
            type="email"
            required
          />
          <input
            name="password"
            value={student.password}
            onChange={handleChange}
            placeholder="Password"
            className="block border p-2 w-full"
            type="password"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 w-full text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditStudent;
