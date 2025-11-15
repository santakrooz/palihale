import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            Polymarket Clone
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link to="/" className="hover:text-blue-200">
                  Markets
                </Link>
                <Link to="/portfolio" className="hover:text-blue-200">
                  Portfolio
                </Link>
                <Link to="/create" className="hover:text-blue-200">
                  Create Market
                </Link>
                <div className="flex items-center gap-4 border-l pl-6 border-blue-400">
                  <div className="text-right">
                    <div className="text-sm opacity-80">{user.username}</div>
                    <div className="font-bold">${user.balance.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
