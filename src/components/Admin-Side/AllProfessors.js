import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "./AdminNav";
import { getCurrentAdminActor } from "../../utils/currentAdmin";

function AllProfessors() {
  useEffect(() => {
    document.title = "All Professors - Tectigon Academy";
  }, []);

  const [professors, setSProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/get_professors_with_courses.php`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch professors");
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
    if (!window.confirm("Are you sure you want to delete this professor?")) return;
    setMessage({ text: "", type: "" });

    fetch(`${process.env.REACT_APP_API_URL}/delete_professor.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Number(id), actor: getCurrentAdminActor() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSProfessors(professors.filter((p) => p.id !== id));
          setMessage({ text: "Professor deleted successfully.", type: "success" });
        } else {
          setMessage({ text: "Failed to delete professor.", type: "error" });
        }
      })
      .catch(() =>
        setMessage({ text: "An error occurred while deleting.", type: "error" })
      );
  };

  if (loading) return <div>Loading professors...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <div className="flex items-center justify-between border-b-2 border-[#c2c2c2] w-full pb-2">
          <h1 className="text-2xl font-semibold">All Professors</h1>
          <Link to="/AddProf">
            <button className="bg-[#152259] hover:bg-[#152239] text-white py-2 px-4 rounded">
              Add Professor
            </button>
          </Link>
        </div>
        {message.text && (
          <p
            className={
              message.type === "success"
                ? "text-green-600 mt-3"
                : "text-red-600 mt-3"
            }
          >
            {message.text}
          </p>
        )}
        <table className="w-full mt-4 border-collapse border border-gray-300">
          <thead>
            <tr className="text-left bg-gray-100">
              <th className="border border-gray-300 p-2">Name</th>
              <th className="border border-gray-300 p-2">Username</th> {/* NEW */}
              <th className="border border-gray-300 p-2">Email</th>
              <th className="border border-gray-300 p-2">Courses</th>
              <th className="border border-gray-300 p-2">Edit</th>
              <th className="border border-gray-300 p-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {professors.map((professor) => (
              <tr key={professor.id} className="border-b border-gray-300">
                <td className="p-2">{professor.name}</td>
                <td className="p-2">
                  {professor.username ?? professor.user_name ?? "-"}
                </td>
                <td className="p-2">{professor.email}</td>
                <td className="p-2">
                  {professor.courses && professor.courses.length > 0
                    ? professor.courses.join(", ")
                    : "No courses"}
                </td>
                <td className="p-2">
                  <Link to={`/edit-professor/${professor.id}`}>
                    <button className="bg-[#152259] hover:bg-[#152239] text-white py-1 px-3 rounded">
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
