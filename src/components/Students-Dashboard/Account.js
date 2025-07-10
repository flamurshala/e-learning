import { useEffect, useState } from "react";
import StudentNav from "../Students-Dashboard/StudentNav";
import Footer from "../Footer";
import LogOut from "./StudentLogOut";

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Account() {
  useEffect(() => {
    document.title = "Account - Tectigon Academy";
  }, []);

  const [student, setStudent] = useState(null);
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    if (!studentId) return;

    fetch(
      `http://localhost/e-learning/backend/get_single_student.php?id=${studentId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success === false) {
          alert("Student not found");
          return;
        }
        setStudent(data);
      })
      .catch((err) => console.error("Failed to load student:", err));
  }, [studentId]);

  if (!student) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <StudentNav />
      <div className="flex flex-col w-[75%] ml-[20%] min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl flex w-[70%] max-w-4xl p-8 gap-8">
            <div className="flex flex-col items-center w-[30%] border-r border-gray-200 pr-8">
              <div className="w-[120px] h-[120px] rounded-full shadow mb-4 bg-[#0e6cff] flex items-center justify-center text-white text-4xl font-bold">
                {getInitials(student.name)}
              </div>

              <h1 className="text-xl font-bold mb-2">{student.name}</h1>
            </div>
            <div className="flex-1 flex flex-col justify-center pl-8">
              <h2 className="text-2xl font-semibold mb-6 text-[#0e6cff]">
                Contact Information
              </h2>
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">
                    Email<span className="text-[#0e6cff]">*</span>
                  </h3>
                  <p className="text-gray-600">{student.email}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">
                    Phone Number<span className="text-[#0e6cff]">*</span>
                  </h3>
                  <p className="text-gray-600">{student.phone_number}</p>
                </div>
                <div className="">
                  <LogOut />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Account;
