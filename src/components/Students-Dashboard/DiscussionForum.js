import React, { useState, useEffect } from "react";
import StudentNav from "./StudentNav";
import Footer from "../Footer";

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function DiscussionForum() {
  const [questionText, setQuestionText] = useState("");
  const [topics, setTopics] = useState([]);
  const [userName, setUserName] = useState(null);
  const [replyInputs, setReplyInputs] = useState({});
  const [replies, setReplies] = useState({});
  const [activeReplyIndex, setActiveReplyIndex] = useState(null);

  useEffect(() => {
    const studentId = localStorage.getItem("studentId");
    if (studentId) {
      fetch(`http://localhost/backend/get_student_name.php?id=${studentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.name) {
            setUserName(data.name);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch student name:", err);
        });
    }
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch("http://localhost/backend/get_questions.php");
      const data = await res.json();

      const formatted = data.map((item) => ({
        id: item.id,
        user: item.user,
        question: item.question,
        time: new Date(item.created_at).toLocaleDateString(),
      }));

      setTopics(formatted);
      formatted.forEach((q) => fetchReplies(q.id));
    } catch (err) {
      console.error("Failed to fetch questions", err);
    }
  };

  const fetchReplies = async (questionId) => {
    try {
      const res = await fetch(
        `http://localhost/backend/get_replies.php?question_id=${questionId}`
      );
      const data = await res.json();

      setReplies((prev) => ({ ...prev, [questionId]: data }));
      setTopics((prevTopics) =>
        prevTopics.map((t) =>
          t.id === questionId ? { ...t, repliesCount: data.length } : t
        )
      );
    } catch (err) {
      console.error("Failed to fetch replies", err);
    }
  };

  const handlePost = async () => {
    if (questionText.trim() === "" || !userName) return;

    try {
      await fetch("http://localhost/backend/add_question.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userName, question: questionText }),
      });

      setQuestionText("");
      fetchQuestions();
    } catch (err) {
      console.error("Failed to post question", err);
    }
  };

  const handleReplyChange = (questionId, text) => {
    setReplyInputs((prev) => ({ ...prev, [questionId]: text }));
  };

  const submitReply = async (questionId) => {
    const replyText = replyInputs[questionId];
    if (!replyText || !userName) return;

    try {
      await fetch("http://localhost/backend/add_reply.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          user: userName,
          reply: replyText,
        }),
      });
      setReplyInputs((prev) => ({ ...prev, [questionId]: "" }));
      fetchReplies(questionId);
      setActiveReplyIndex(null);
    } catch (err) {
      console.error("Failed to post reply", err);
    }
  };

  useEffect(() => {
    if (userName) fetchQuestions();
  }, [userName]);

  return (
    <div className="min-h-screen bg-gray-100">
      <StudentNav />
      <main className="ml-[18%] p-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-semibold border-b border-black pb-3 mb-8">
          Discussion Forum
        </h1>

        <section className="bg-white shadow p-6 rounded mb-10 flex flex-col items-center">
          <h2 className="text-3xl mb-1">
            Ask <span className="text-[#0e6cff]">Anything</span>
          </h2>
          <p className="text-lg text-center mb-6">
            <span className="text-[#0e6cff]">Get answered</span> by students
          </p>

          <div className="w-full relative">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question here..."
              className="w-full h-28 p-4 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handlePost}
              className="absolute bottom-4 right-4 bg-[#0e6cff] text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Post Question
            </button>
          </div>
        </section>

        <section className="shadow rounded overflow-hidden">
          <div className="grid grid-cols-5 bg-[#0e6cff] text-white font-bold px-6 py-3">
            <div className="col-span-2">Topics</div>
            <div>Replies</div>
            <div>Actions</div>
          </div>

          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="grid grid-cols-5 items-start px-6 py-5 border-t bg-white hover:bg-gray-50 transition"
            >
              <div className="col-span-2 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#0e6cff] flex items-center justify-center text-white text-lg font-bold">
                  {getInitials(topic.user)}
                </div>
                <div className="flex flex-col">
                  <p className="font-medium text-gray-800">{topic.question}</p>
                  <p className="text-sm text-blue-600">{topic.user}</p>
                  <p className="text-xs text-gray-500">{topic.time}</p>

                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {(replies[topic.id] || []).map((reply) => (
                      <div
                        key={reply.id}
                        className="flex items-start gap-2 border border-gray-200 rounded p-2 bg-gray-50"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#0e6cff] flex items-center justify-center text-white text-base font-bold mt-1">
                          {getInitials(reply.user)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{reply.user}</p>
                          <p className="text-sm">{reply.reply}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(reply.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-blue-600 flex flex-col items-center justify-center font-semibold">
                {topic.repliesCount || 0}
                <span className="text-gray-500 text-sm">Replies</span>
              </div>

              <div className="flex flex-col items-center justify-center">
                <button
                  onClick={() =>
                    setActiveReplyIndex(activeReplyIndex === index ? null : index)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded transition"
                >
                  {activeReplyIndex === index ? "Cancel" : "Reply"}
                </button>

                {activeReplyIndex === index && (
                  <div className="mt-3 w-full">
                    <textarea
                      value={replyInputs[topic.id] || ""}
                      onChange={(e) => handleReplyChange(topic.id, e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Write your reply..."
                      rows={3}
                    />
                    <button
                      onClick={() => submitReply(topic.id)}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded transition"
                    >
                      Submit Reply
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
        <div className="mt-[10%]">
        <Footer />
        </div>
      </main>
    </div>
  );
}

export default DiscussionForum;
