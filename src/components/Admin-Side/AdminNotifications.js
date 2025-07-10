import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    document.title = "Admin Notifications - Tectigon Academy";

    fetch("http://localhost/e-learning/backend/get_admin_notifications.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setNotifications(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch notifications.");
        setLoading(false);
      });
  }, []);

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      const allIds = notifications.map((n) => n.id);
      setSelectedIds(allIds);
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return alert("No notifications selected.");

    const confirm = window.confirm(
      "Are you sure you want to delete selected notifications?"
    );
    if (!confirm) return;

    try {
      const res = await fetch(
        "http://localhost/e-learning/backend/delete_multiple_notifications.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: selectedIds }),
        }
      );

      const result = await res.json();

      if (result.success) {
        setNotifications((prev) =>
          prev.filter((n) => !selectedIds.includes(n.id))
        );
        setSelectedIds([]);
        setSelectAll(false);
      } else {
        alert("Failed to delete: " + result.error);
      }
    } catch (err) {
      alert("Something went wrong while deleting.");
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminNav />
      <main className="w-[75%] ml-[22%] mt-10 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">
          🔔 Admin Notifications
        </h1>

        {loading && <p className="text-gray-500">Loading notifications...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && notifications.length === 0 && (
          <p className="text-gray-500">No notifications yet.</p>
        )}

        {notifications.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="mr-2"
              />
              Select All
            </label>
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md shadow"
            >
              Delete Selected
            </button>
          </div>
        )}

        <ul className="space-y-4">
          {notifications.map((note) => (
            <li
              key={note.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-start justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(note.id)}
                  onChange={() => handleSelect(note.id)}
                  className="mt-1"
                />
                <div>
                  <p className="text-gray-800 text-base font-medium">
                    {note.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default AdminNotifications;
