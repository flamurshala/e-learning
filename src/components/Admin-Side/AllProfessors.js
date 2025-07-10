import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "./AdminNav";

function AllProfessors() {
  useEffect(() => {
    document.title = "All Professors - Tectigon Academy";
  }, []);

  const [professors, setSProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost/e-learning/backend/get_professors_with_courses.php")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch students");
        return res.json();
      })
      .then((data) => {
        setSProfessors(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this professor?"))
      return;

    fetch("http://localhost/e-learning/backend/delete_professor.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Number(id) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSProfessors(professors.filter((p) => p.id !== id));
        } else {
          alert("Failed to delete professor.");
        }
      })
      .catch(() => alert("Error occurred while deleting."));
  };

  if (loading) return <div>Loading profeesors...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-[100%]">
          All Professors
        </h1>
        <table className="w-full mt-4 border-collapse border border-gray-300">
          <thead>
            <tr className="text-left bg-gray-100">
              <th className="border border-gray-300 p-2">Name</th>
              <th className="border border-gray-300 p-2">Email</th>
              <th className="border border-gray-300 p-2">Password</th>
              <th className="border border-gray-300 p-2">Courses</th>
              <th className="border border-gray-300 p-2">Edit</th>
              <th className="border border-gray-300 p-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {professors.map((professor) => (
              <tr key={professor.id} className="border-b border-gray-300">
                <td className="p-2">{professor.name}</td>
                <td className="p-2">{professor.email}</td>
                <td className="p-2 font-mono text-sm">{professor.password}</td>
                <td className="p-2">
                  {professor.courses.length > 0
                    ? professor.courses.join(", ")
                    : "No courses"}
                </td>
                <td className="p-2">
                  <Link to={`/edit-professor/${professor.id}`}>
                    <button className="bg-blue-600 hover:bg-blue-800 text-white py-1 px-3 rounded">
                      Edit
                    </button>
                  </Link>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(professor.id)}
                    className="bg-red-600 hover:bg-red-800 text-white py-1 px-3 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AllProfessors;
