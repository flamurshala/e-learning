import { useEffect, useState } from "react";
import { FaBullhorn } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import ProffesorNav from "./ProffesorNav";

function StudentAnnouncements() {
  useEffect(() => {
    document.title = "Announcements - Tectigon Academy";
  }, []);

  const [announcements, setAnnouncements] = useState([]);
  const professor_id = localStorage.getItem("professorId");

  useEffect(() => {
    fetch(
      `${process.env.REACT_APP_API_URL}/get_announcements.php?audience=professorss&user_id=${professor_id}`
    )
      .then((res) => res.json())
      .then(setAnnouncements);
  }, [professor_id]);

  const clearAllAnnouncements = () => {
    if (!window.confirm("Are you sure you want to clear all announcements?"))
      return;

    fetch(`${process.env.REACT_APP_API_URL}/clear_announcements.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: localStorage.getItem("studentId"),
        user_type: "student",
        audience: "students",
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setAnnouncements([]);
        } else {
          alert("Failed to clear announcements");
          console.error(res.error);
        }
      });
  };

  return (
    <div className="flex">
      <ProffesorNav />
      <div className="w-[75%] mt-10 px-4 ml-[20%]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaBullhorn className="text-yellow-400 animate-pulse" />
            Announcements from{" "}
            <span>
              <a href="https://tectigonllc.com/" className="text-[#0e6cff]">
                {" "}
                Tectigon Academy
              </a>
            </span>
          </h1>
          <button
            onClick={clearAllAnnouncements}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-all"
          >
            Clear All
          </button>
        </div>
        <AnimatePresence>
          {announcements.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow p-5 mb-4 border relative hover:shadow-md transition-all"
            >
              <h2 className="text-lg font-semibold text-gray-800">{a.title}</h2>
              <p className="text-gray-600">{a.content}</p>
              <small className="text-gray-400 block mt-1">{a.created_at}</small>
            </motion.div>
          ))}
        </AnimatePresence>
        {announcements.length === 0 && (
          <p className=" text-gray-500 mt-8">No announcements available.</p>
        )}
      </div>
    </div>
  );
}

export default StudentAnnouncements;
