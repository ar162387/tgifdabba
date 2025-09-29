import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-black text-white py-14">
      <div className="max-w-6xl mx-auto px-6">
        {/* Centered navigation links */}
        <div className="flex flex-col items-center space-y-8">
          {/* TGIF DABBA branding */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wide text-accent-yellow mb-2">
              TGIF DABBA
            </h2>
            <p className="text-white/80 text-lg">
              The Great Indian Food
            </p>
          </div>
          
          {/* Horizontal navigation links with theme colors */}
          <nav className="flex flex-wrap justify-center items-center gap-16 md:gap-20">
            <a 
              onClick={() => navigate('/menu')}
              className="footer-link text-lg font-semibold uppercase tracking-wide cursor-pointer"
            >
              Menu
            </a>
            <a 
              onClick={() => navigate('/about')}
              className="footer-link text-lg font-semibold uppercase tracking-wide cursor-pointer"
            >
              About
            </a>
            <a 
              onClick={() => navigate('/contact')}
              className="footer-link text-lg font-semibold uppercase tracking-wide cursor-pointer"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
