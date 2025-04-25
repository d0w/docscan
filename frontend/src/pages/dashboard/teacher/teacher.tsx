import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Assignment } from '../../../types';
import { useAuth } from '../../../components/AuthContext';

const TeacherDashboard = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/assignments/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch teacher data');
        }

        const data = await response.json();
        const assignments: Assignment[] = data.map((item: any) => ({
          id: item.id,
          dueDate: item.due_date,
          description: item.description,
          title: item.title,
        }));

        setAssignments(assignments);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTeacherData();
    }
  }, [token]);

  // Sort assignments by due date (earliest first)
  const sortedAssignments = [...assignments].sort((a, b) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Teacher Dashboard</h1>
        <Link
          to="/dashboard/createassignment"
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-md transition-colors"
        >
          Create New Assignment
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-text-light">Loading your dashboard...</p>
        </div>
      ) : error ? (
        <div className="bg-error/20 border border-error text-error px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <div className="grid gap-6">
          {sortedAssignments.length === 0 ? (
            <p className="text-text-muted py-4">You haven't created any assignments yet.</p>
          ) : (
            sortedAssignments.map(assignment => (
              <div key={assignment.id} className="bg-card-dark rounded-lg shadow-md p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-1">{assignment.title}</h3>
                    <p className="text-text-muted text-sm">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/teacher/assignments/${assignment.id}`}
                    className="px-3 py-1 bg-accent hover:bg-accent-hover text-text-primary text-sm rounded"
                  >
                    View Submissions
                  </Link>
                </div>
                <p className="text-text-light mt-3 line-clamp-2">{assignment.description}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};


export default TeacherDashboard;

