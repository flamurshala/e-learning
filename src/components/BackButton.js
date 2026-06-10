// src/components/BackButton.js
import { useNavigate } from "react-router-dom";

export default function BackButton({ text = "Back", to, className = "" }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to || -1)}
      className={`inline-flex items-center justify-center bg-[#152259] hover:bg-[#1C2F81] text-white font-medium py-2 px-4 rounded shadow ${className}`}
    >
      ← {text}
    </button>
  );
}
