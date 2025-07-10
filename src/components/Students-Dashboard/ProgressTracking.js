import { useEffect, useState } from "react";
import StudentNav from "./StudentNav";
import Footer from "../Footer";

function ProgressTracking() {
  useEffect(() => {
    document.title = "Progress Tracking - Tectigon Academy";
  }, []);

  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animatedPercentages, setAnimatedPercentages] = useState([]);

  useEffect(() => {
    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
      console.error("No student ID found in localStorage");
      return;
    }

    fetch(
      `http://localhost/backend/get_student_progress.php?student_id=${studentId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProgressData(data);
          setTimeout(() => {
            setAnimatedPercentages(data.map((c) => c.completion_percent));
          }, 100);
        } else {
          console.error("Unexpected response:", data);
        }
      })
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-[100%] bg-gray-100">
      <div className="flex">
        <StudentNav />
        <div className="flex-1 p-4 ml-[20%]">
          <h1 className="text-4xl font-medium border-b border-black mb-8">
            Progress Tracking
          </h1>

          {loading ? (
            <p>Loading progress...</p>
          ) : progressData.length === 0 ? (
            <p>No course progress available.</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {progressData.map((course, idx) => {
                const percent = animatedPercentages[idx] || 0;
                const strokeDasharray = 283;
                const strokeDashoffset =
                  strokeDasharray - (strokeDasharray * percent) / 100;

                return (
                  <div
                    key={course.course_id}
                    className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center w-[300px]"
                  >
                    <div className="relative w-32 h-32 mb-6">
                      <svg className="w-full h-full">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45"
                          stroke="#e5e7eb"
                          strokeWidth="10"
                          fill="none"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45"
                          stroke="#3b82f6"
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          style={{
                            transition: "stroke-dashoffset 1s ease-out",
                            transform: "rotate(-90deg)",
                            transformOrigin: "center",
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {percent}%
                        </span>
                      </div>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      {course.course_title}
                    </h2>
                    <p className="text-gray-500 mb-6 text-center">
                      You have completed {percent}% of this course.
                    </p>

                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between w-full text-sm text-gray-500 mb-2">
                      <span>Start</span>
                      <span>End</span>
                    </div>

                    {percent >= 70 && (
                      <a
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 text-sm"
                        href={`http://localhost/backend/generate_certificate.php?student_id=${localStorage.getItem(
                          "studentId"
                        )}&course_id=${course.course_id}`}
                        download
                      >
                        Download Certificate
                      </a>
                    )}
                  </div>
                );
              })}
              
            </div>
            
          )}
          <div className="mt-[30%]">
            <Footer />
          </div>
          
        </div>
        
      </div>
    </div>
  );
}

export default ProgressTracking;
