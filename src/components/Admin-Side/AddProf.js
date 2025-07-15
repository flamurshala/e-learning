import { useState, useEffect } from "react";
import AdminNav from "./AdminNav";

function AddUsers() {
  useEffect(() => {
    document.title = "Add Users - Tectigon Academy";
  }, []);

  const [professorName, setProfessorName] = useState("");
  const [professorEmail, setProfessorEmail] = useState("");
  const [professorPassword, setProfessorPassword] = useState("");
  const isEmpty = (val) => !val.trim();

  const handleProfessorSubmit = (e) => {
    e.preventDefault();

    if ([professorName, professorEmail, professorPassword].some(isEmpty)) {
      alert("Please enter all professor fields.");
      return;
    }

    const payload = {
      name: professorName,
      email: professorEmail,
      password: professorPassword,
    };

    fetch("http://localhost/e-learning/backend/add_professors.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Professor added successfully!");
          setProfessorName("");
          setProfessorEmail("");
          setProfessorPassword("");
        } else {
          alert("Error adding professor: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Professor error:", err);
        alert("Error adding professor. Check console.");
      });
  };
  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-[95%]">Add a new User</h1>
        <div className="cards mt-6 items-center flex flex-wrap gap-4">
          <div className="card border shadow-xl border-black p-5 w-[45%]">
            <form onSubmit={handleProfessorSubmit}>
              <h3 className="text-2xl mb-8 font-semibold border-b-2 border-[#c2c2c2]">Add a new professor</h3>
              <input className="mb-4 w-full border border-black p-2" type="text" name="professorName" placeholder="Name" value={professorName} onChange={(e) => setProfessorName(e.target.value)} required />
              <input className="mb-4 w-full border border-black p-2" type="email" name="professorEmail" placeholder="Email" value={professorEmail} onChange={(e) => setProfessorEmail(e.target.value)} required />
               <input className="mb-4 w-full border border-black p-2" type="password" name="professorPassword" placeholder="Password" value={professorPassword} onChange={(e) => setProfessorPassword(e.target.value)} required />
              <button type="submit" className="bg-[#152259] text-white px-4 py-2 rounded hover:bg-[#152239]">Add</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddUsers;
