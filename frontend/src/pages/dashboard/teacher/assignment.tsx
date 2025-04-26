import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../../components/AuthContext';
import { Assignment, File } from '../../../types';



const TeacherAssignment = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId || !token) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/assignments/${assignmentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch assignment details');
        }

        const data = await response.json();

        const assignmentData: Assignment = {
          id: data.id,
          title: data.title,
          description: data.description,
          studentIds: data.student_ids,
          dueDate: data.due_date,

        }

        setAssignment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId, token]);

  const handleViewSubmissions = () => {
    navigate(`/dashboard/assignments/${assignmentId}/submissions/`);
  };

  const handleSubmissionClick = (submissionId: string) => {
    navigate(`/dashboard/assignments/${assignmentId}/submissions/${submissionId}`);

  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-success/20 text-success';
      case 'submitted':
        return 'bg-primary/20 text-primary';
      case 'late':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-accent/20 text-accent';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {loading && (
        <div className="text-center py-4 text-text-light">Loading assignment details...</div>
      )}

      {error && (
        <div className="bg-error/20 border border-error text-error px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={() => navigate('/dashboard/')}
        className="mr-4 mb-6 text-text-muted hover:text-text-primary transition-colors"
      >
        ← Back to Dashboard
      </button>

      {assignment && (
        <div className="bg-card-dark shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2 text-text-primary">{assignment.title}</h1>
          <p className="text-text-muted mb-4">
            Due: {formatDate(assignment.dueDate)}
          </p>
          <div className="prose max-w-none mb-6 text-text-light">
            <p>{assignment.description}</p>
          </div>

          <div className="mt-8 border-t border-secondary pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Submissions Overview</h2>
              <button
                onClick={handleViewSubmissions}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded transition-colors"
              >
                View All Submissions
              </button>
            </div>

            {assignment.submissions?.length > 0 ? (
              <div className="space-y-4">
                {assignment.submissions?.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="hover:cursor-pointer bg-background-dark p-4 rounded border border-secondary" onClick={() => handleSubmissionClick(submission.id)}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium text-text-primary">{submission.student?.name}</h3>
                        <p className="text-sm text-text-muted">
                          {/* Submitted: {new Date(submission.submitted_at).toLocaleString()} */}
                        </p>
                      </div>
                      {/* <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(submission.status)}`}> */}
                      {/*   {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)} */}
                      {/* </span> */}
                    </div>

                    {submission.files.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-text-light">Files: {submission.files.length}</p>
                      </div>
                    )}
                  </div>
                ))}

                {assignment.submissions.length > 5 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={handleViewSubmissions}
                      className="text-primary hover:text-primary-hover text-sm"
                    >
                      View all {assignment.submissions.length} submissions
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text-muted py-4">No submissions received yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignment;

