import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../../components/AuthContext';

import { Assignment } from '../../../types';


const StudentDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch('/api/assignments/', {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });


        if (!response.ok) {
          throw new Error('Failed to fetch assignments');
        }

        const data = await response.json();
        const mappedAssignments = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          dueDate: item.due_date,
        }));
        setAssignments(mappedAssignments as Assignment[]);


      } catch (err) {
        console.log(err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [token]);

  if (loading) {
    return <div className="text-center text-text-light">Loading assignments...</div>;
  }

  if (error) {
    return <div className="text-center text-error">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-primary mb-4">My Assignments</h1>
      {assignments.length === 0 ? (
        <p className="text-text-muted">No assignments found.</p>
      ) : (
        <ul className="space-y-4">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="p-4 bg-card-dark rounded shadow hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold text-accent">{assignment.title}</h2>
              <p className="text-text-muted">{assignment.description}</p>
              <p className="text-sm text-warning">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
              <Link
                to={`/dashboard/assignments/${assignment.id}`}
                className="text-primary hover:text-primary-hover mt-2 inline-block"
              >
                View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentDashboard;
