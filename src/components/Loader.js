import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import img from './img/logo.png';

const LoadingPage = () => {
  useEffect(() => {
    document.title = "Loading - Tectigon Academy";
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("LoginAs"); 
    }, 2000); 

    return () => clearTimeout(timer); 
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#0e6cff]">
      <div className="text-center">
        <img src={img} className="w-[70%] swipe-up m-auto" alt="logo"/>
      </div>
    </div>
  );
};

export default LoadingPage;
