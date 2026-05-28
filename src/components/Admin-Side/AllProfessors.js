import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "./AdminNav";
import { getCurrentAdminActor } from "../../utils/currentAdmin";

function AllProfessors() {
  useEffect(() => {
    document.title = "Të gjithë profesorët - Tectigon Academy";
  }, []);

  const [professors, setSProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/get_professors_with_courses.php`)
      .then((res) => {
        if (!res.ok) throw new Error("Nuk u arrit të merren profesorët");
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
    if (!window.confirm("A jeni i sigurt që dëshironi ta fshini këtë profesor?")) return;
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
          setMessage({ text: "Profesori u fshi me sukses.", type: "success" });
        } else {
          setMessage({ text: "Fshirja e profesorit dështoi.", type: "error" });
        }
      })
      .catch(() =>
        setMessage({ text: "Ndodhi një gabim gjatë fshirjes.", type: "error" })
      );
  };

  if (loading) return <div>Duke ngarkuar profesorët...</div>;
  if (error) return <div>Gabim: {error}</div>;

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <div className="flex items-center justify-between border-b-2 border-[#c2c2c2] w-full pb-2">
          <h1 className="text-2xl font-semibold">Të gjithë profesorët</h1>
          <Link to="/AddProf">
            <button className="bg-[#152259] hover:bg-[#152239] text-white py-2 px-4 rounded">
              Shto profesor
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
              <th className="border border-gray-300 p-2">Emri</th>
              <th className="border border-gray-300 p-2">Emri i përdoruesit</th> {/* NEW */}
              <th className="border border-gray-300 p-2">Email</th>
              <th className="border border-gray-300 p-2">Kurset</th>
              <th className="border border-gray-300 p-2">Ndrysho</th>
              <th className="border border-gray-300 p-2">Fshi</th>
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
                    : "Nuk ka kurse"}
                </td>
                <td className="p-2">
                  <Link to={`/edit-professor/${professor.id}`}>
                    <button className="bg-[#152259] hover:bg-[#152239] text-white py-1 px-3 rounded">
                     Ndrysho
                    </button>
                  </Link>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(professor.id)}
                    className="bg-red-600 hover:bg-red-800 text-white py-1 px-3 rounded"
                  >
                   Fshie
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
