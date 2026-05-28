import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminNav from "./AdminNav";
import { getCurrentAdminActor } from "../../utils/currentAdmin";

function EditAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const isAdministrata = admin.role === "administrata";

  useEffect(() => {
    document.title = "Ndrysho administratorin - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_single_admin.php?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success === false) {
          setMessage({ text: data.error || "Admin not found.", type: "error" });
          return;
        }

        setAdmin({
          username: data.username || "",
          email: data.email || "",
          password: "",
          role: data.role || "admin",
        });
      })
      .catch(() =>
        setMessage({ text: "Nuk u arrit të ngarkohet administratori.", type: "error" })
      );
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdmin((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    fetch(`${process.env.REACT_APP_API_URL}/update_admin.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...admin, actor: getCurrentAdminActor() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage({ text: "Administratori u përditësua me sukses.", type: "success" });
          navigate("/AllAdmins");
        } else {
          setMessage({
            text: data.error || "Përditësimi i administratorit dështoi.",
            type: "error",
          });
        }
      })
      .catch(() =>
        setMessage({ text: "Përditësimi i administratorit dështoi.", type: "error" })
      );
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="ml-[22%] mt-10 w-[75%] flex justify-start">
        <div className="bg-white shadow-md border border-black rounded p-6 w-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Ndrysho administratorin</h2>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
            >
              Kthehu
            </button>
          </div>

          {message.text && (
            <p
              className={
                message.type === "success"
                  ? "text-green-600 mb-4"
                  : "text-red-600 mb-4"
              }
            >
              {message.text}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <select
              name="role"
              className="w-full mb-3 p-2 border border-gray-300 rounded"
              value={admin.role}
              onChange={handleChange}
            >
              <option value="admin">Administrator</option>
              <option value="superadmin">Superadministrator</option>
              <option value="administrata">Administrata</option>
            </select>

            <input
              name="username"
              type="text"
              placeholder={isAdministrata ? "Kodi i aksesit me 4 shifra" : "Emri i përdoruesit"}
              className="w-full mb-3 p-2 border border-gray-300 rounded"
              value={admin.username}
              onChange={handleChange}
              maxLength={isAdministrata ? 4 : undefined}
              inputMode={isAdministrata ? "numeric" : "text"}
              required
            />

            <input
              name="email"
              type="email"
              placeholder={isAdministrata ? "Email (opsional)" : "Email"}
              className="w-full mb-3 p-2 border border-gray-300 rounded"
              value={admin.email}
              onChange={handleChange}
              required={!isAdministrata}
            />

            <input
              name="password"
              type="password"
              placeholder={
                isAdministrata ? "Fjalëkalim i ri për kodin e aksesit (opsional)" : "Fjalëkalim i ri (opsional)"
              }
              className="w-full mb-3 p-2 border border-gray-300 rounded"
              value={admin.password}
              onChange={handleChange}
            />

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded"
            >
              Ruaj ndryshimet
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditAdmin;
