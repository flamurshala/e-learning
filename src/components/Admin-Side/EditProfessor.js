import AdminNav from "./AdminNav";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function EditProfessor() {
  useEffect(() => {
    document.title = "Edit Professor - Tectigon Academy";
  }, []);

  const { id } = useParams();
  const navigate = useNavigate();

  const [professor, setProfessor] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    fetch(
      `${process.env.REACT_APP_API_URL}/get_single_professor.php?id=${id}`
    )
      .then((res) => res.json())
      .then((data) => setProfessor(data))
      .catch((err) => console.error("Failed to load professor", err));
  }, [id]);

  const handleChange = (e) => {
    setProfessor({ ...professor, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${process.env.REACT_APP_API_URL}/update_professor.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...professor }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          navigate("/AllProfessors");
        } else {
          alert("Update failed");
        }
      });
  };

  return (
    <div className="flex gap-4 ">
      <AdminNav />
      <div className="w-[30%] ml-[22%] mt-[2rem]">
        <div className="flex  items-center justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4">Edit Professor</h1>
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
            value={professor.name}
            onChange={handleChange}
            className="block border p-2 w-full"
            placeholder="Name"
          />
          <input
            name="email"
            value={professor.email}
            onChange={handleChange}
            className="block border p-2 w-full"
            placeholder="Email"
          />
          <input
            name="password"
            value={professor.password}
            onChange={handleChange}
            className="block border p-2 w-full"
            placeholder="Password"
          />
          <button
            type="submit"
            className="bg-blue-600 w-[100%  ] text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfessor;
