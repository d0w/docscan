import React from 'react';
import { useAuth } from '../../components/AuthContext';
import { Link, Outlet } from 'react-router';
import { Navigate } from 'react-router';
import { NavLink } from 'react-router';

const DashboardLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background-dark">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-dark text-text-light">
      <header className="bg-primary text-text-primary p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">DocScan Dashboard</h1>
          <div>
            <span className="mr-4">Welcome, {user.name} (<span className="text-text-muted italic">{user.role}</span>)</span>
            <button
              onClick={logout}
              className="bg-error px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <nav className="w-64 bg-card-dark p-4">
          <ul className="space-y-4">
            {user.role === 'student' ? (
              <>
                <li>
                  <NavLink
                    to="/dashboard/assignments"
                    className="text-accent hover:text-accent-hover"
                  >
                    {({ isActive }) => (
                      <span className={`${isActive ? "text-text-primary" : ""}`}>My Assignments</span>
                    )
                    }
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/dashboard/upload"
                    className="text-accent hover:text-accent-hover"
                  >
                    {({ isActive }) => (
                      <span className={`${isActive ? "text-text-primary" : ""}`}>Upload Assignment</span>
                    )
                    }
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink
                    to="/dashboard/createassignment"
                    className="text-accent hover:text-accent-hover"
                  >
                    {({ isActive }) => (
                      <span className={`${isActive ? "text-text-primary" : ""}`}>Create Assignment</span>
                    )
                    }
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/dashboard/submissions"
                    className="text-accent hover:text-accent-hover"
                  >
                    {({ isActive }) => (
                      <span className={`${isActive ? "text-text-primary" : ""}`}>Student Submissions</span>
                    )
                    }

                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/dashboard/document-scanner"
                    className="text-accent hover:text-accent-hover"
                  >

                    {({ isActive }) => (
                      <span className={`${isActive ? "text-text-primary" : ""}`}>Analyze Document</span>
                    )
                    }

                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div >
  );
};


export default DashboardLayout;
