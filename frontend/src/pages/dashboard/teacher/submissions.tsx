import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../../../components/AuthContext';

interface Submission {
  id: string;
  student_name: string;
  student_id: string;
  status: 'submitted' | 'graded' | 'late' | 'pending';
  submitted_at: string;
  grade?: number;
  feedback?: string;
  content: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  submissions: Submission[];
}

const SubmissionsPage = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/assignments/${assignmentId}/submissions/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });


        if (!response.ok) {
          throw new Error('Failed to fetch assignment details');
        }

        const data = await response.json();
        console.log(data)
        setAssignment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId && token) {
      fetchAssignmentDetails();
    }
  }, [assignmentId, token]);

  const handleSubmissionClick = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const closeSubmissionDetail = () => {
    setSelectedSubmission(null);
  };

  // Calculate submission statistics
  const submissionStats = assignment?.submissions ? {
    total: assignment.submissions.length,
    submitted: assignment.submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length,
    graded: assignment.submissions.filter(s => s.status === 'graded').length,
    pending: assignment.submissions.filter(s => s.status === 'pending').length,
    late: assignment.submissions.filter(s => s.status === 'late').length,
  } : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/dashboard/')}
          className="mr-4 text-text-muted hover:text-text-primary transition-colors"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-text-primary">
          {loading ? 'Loading Assignment...' : assignment?.title}
        </h1>
      </div>

      {error && (
        <div className="bg-error/20 border border-error text-error px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-text-light">Loading submissions...</p>
        </div>
      ) : assignment ? (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-card-dark rounded-lg shadow-md p-5">
            <h2 className="text-xl font-semibold text-text-primary mb-3">Assignment Details</h2>
            <p className="text-text-light mb-3">{assignment.description}</p>
            <p className="text-text-muted text-sm">
              <span className="font-medium">Due Date:</span> {new Date(assignment.dueDate).toLocaleDateString()}
            </p>
          </div>

          {submissionStats && (
            <div className="bg-card-dark rounded-lg shadow-md p-5">
              <h2 className="text-xl font-semibold text-text-primary mb-3">Submission Overview</h2>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-background-dark p-3 rounded">
                  <p className="text-2xl font-bold text-text-primary">{submissionStats.submitted}</p>
                  <p className="text-text-muted text-sm">Submitted</p>
                </div>
                <div className="bg-background-dark p-3 rounded">
                  <p className="text-2xl font-bold text-text-primary">{submissionStats.pending}</p>
                  <p className="text-text-muted text-sm">Pending</p>
                </div>
                <div className="bg-background-dark p-3 rounded">
                  <p className="text-2xl font-bold text-text-primary">{submissionStats.graded}</p>
                  <p className="text-text-muted text-sm">Graded</p>
                </div>
                <div className="bg-background-dark p-3 rounded">
                  <p className="text-2xl font-bold text-text-primary">{submissionStats.late}</p>
                  <p className="text-text-muted text-sm">Late</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card-dark rounded-lg shadow-md p-5">
            <h2 className="text-xl font-semibold text-text-primary mb-3">Student Submissions</h2>

            {assignment.submissions.length === 0 ? (
              <p className="text-text-muted py-4">No submissions yet.</p>
            ) : (
              <div className="divide-y divide-gray-700">
                {assignment.submissions.map(submission => (
                  <div
                    key={submission.id}
                    onClick={() => handleSubmissionClick(submission)}
                    className="py-3 cursor-pointer hover:bg-background-dark transition-colors px-2 rounded"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-text-primary">{submission.student_name}</h3>
                        <p className="text-text-muted text-sm">
                          Submitted: {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${submission.status === 'graded' ? 'bg-success/20 text-success' :
                            submission.status === 'submitted' ? 'bg-primary/20 text-primary' :
                              submission.status === 'late' ? 'bg-warning/20 text-warning' :
                                'bg-accent/20 text-accent'
                            }`}
                        >
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                        {submission.status === 'graded' && (
                          <span className="ml-2 text-text-primary font-medium">
                            {submission.grade}/100
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-text-muted">Assignment not found.</p>
      )}

      {/* Submission detail modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card-dark rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-text-primary">
                  Submission from {selectedSubmission.student_name}
                </h3>
                <button
                  onClick={closeSubmissionDetail}
                  className="text-text-muted hover:text-text-primary"
                >
                  &times;
                </button>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-text-muted mb-1">Submission Status</h4>
                <div className="flex items-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${selectedSubmission.status === 'graded' ? 'bg-success/20 text-success' :
                      selectedSubmission.status === 'submitted' ? 'bg-primary/20 text-primary' :
                        selectedSubmission.status === 'late' ? 'bg-warning/20 text-warning' :
                          'bg-accent/20 text-accent'
                      }`}
                  >
                    {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
                  </span>
                  <span className="ml-2 text-text-muted text-sm">
                    Submitted on {new Date(selectedSubmission.submitted_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-text-muted mb-1">Submission Content</h4>
                <div className="bg-background-dark p-4 rounded border border-secondary">
                  <pre className="whitespace-pre-wrap text-text-primary font-mono text-sm">
                    {selectedSubmission.content}
                  </pre>
                </div>
              </div>

              {selectedSubmission.status === 'graded' && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-text-muted mb-1">Grade & Feedback</h4>
                  <div className="bg-background-dark p-4 rounded border border-secondary">
                    <p className="text-text-primary font-medium mb-2">
                      Grade: {selectedSubmission.grade}/100
                    </p>
                    <p className="text-text-light">
                      {selectedSubmission.feedback || 'No feedback provided.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Link
                  to={`/dashboard/teacher/submissions/${assignment?.id}/grade/${selectedSubmission.id}`}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-md transition-colors"
                >
                  {selectedSubmission.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsPage;

