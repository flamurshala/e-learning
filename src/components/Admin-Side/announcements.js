import { useState } from "react";
import AdminNav from "./AdminNav";
import { useEffect } from "react";

function Announcements() {
  useEffect(() => {
    document.title = "Send Announcement - Tectigon Academy";
  }, []);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("students");

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch(`${process.env.REACT_APP_API_URL}/create_announcement.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, audience }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Announcement sent!");
          setTitle("");
          setContent("");
          setAudience("students");
        } else {
          alert("Error: " + data.error);
        }
      });
  };

  return (
    <div className="flex">
      <AdminNav />
      <div className="w-[75%] ml-[22%] p-6 bg-white">
        <h2 className="text-2xl font-bold border-b-2 border-[#c2c2c2] mb-4">
          Send Announcement
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            className="w-full border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Message"
            className="w-full border p-2 rounded"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
          <label className="block mb-2 font-medium">
            Choose where do you want to sned the announcement
          </label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="students">Students</option>
            <option value="professors">Professors</option>
          </select>
          <button
            type="submit"
            className="bg-[#0e6cff] text-white py-2 px-4 rounded hover:bg-blue-800"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Announcements;
