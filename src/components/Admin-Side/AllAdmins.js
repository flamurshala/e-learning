import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "./AdminNav";

function AllAdmins() {
  useEffect(() => {
    document.title = "All Admins - Tectigon Academy";
  }, []);

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/get_admins.php`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch admins");
        return res.json();
      })
      .then((data) => {
        setAdmins(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;

    fetch(`${process.env.REACT_APP_API_URL}/delete_admin.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAdmins(admins.filter((a) => a.id !== id));
        } else {
          alert("Failed to delete admin.");
        }
      })
      .catch(() => alert("Error occurred while deleting."));
  };

  if (loading) return <div>Loading admins...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-full">
          All Admins
        </h1>
        <table className="w-full mt-4 border-collapse border border-gray-300">
          <thead>
            <tr className="text-left bg-gray-100">
              <th className="border border-gray-300 p-2">Username</th>
              <th className="border border-gray-300 p-2">Email</th>
              <th className="border border-gray-300 p-2">Role</th>
              {/* <th className="border border-gray-300 p-2">Edit</th> */}
              <th className="border border-gray-300 p-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b border-gray-300">
                <td className="p-2">{admin.username}</td>
                <td className="p-2">{admin.email}</td>
                <td className="p-2 capitalize">{admin.role}</td>
                {/* <td className="p-2">
                  <Link to={`/edit-admin/${admin.id}`}>
                    <button className="bg-[#152259] hover:bg-[#152239] text-white py-1 px-3 rounded">
                      Edit
                    </button>
                  </Link>
                </td> */}
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(admin.id)}
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

export default AllAdmins;
