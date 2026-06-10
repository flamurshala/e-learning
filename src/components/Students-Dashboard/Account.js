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
      <div className="ml-[20%] flex min-h-screen w-[75%] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center py-6">
          <div className="flex w-[70%] max-w-4xl flex-col gap-6 rounded-2xl bg-white p-5 shadow-2xl sm:p-8 md:flex-row md:gap-8">
            <div className="flex w-full flex-col items-center border-b border-gray-200 pb-6 md:w-[30%] md:border-b-0 md:border-r md:pb-0 md:pr-8">
              <div className="w-[120px] h-[120px] rounded-full shadow mb-4 bg-[#0e6cff] flex items-center justify-center text-white text-4xl font-bold">
                {getInitials(student.name)}
              </div>

              <h1 className="text-xl font-bold mb-2">{student.name}</h1>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center md:pl-8">
              <h2 className="text-2xl font-semibold mb-6 text-[#0e6cff]">
                Contact Information
              </h2>
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">
                    Email<span className="text-[#0e6cff]">*</span>
                  </h3>
                  <p className="break-words text-gray-600">{student.email}</p>
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
