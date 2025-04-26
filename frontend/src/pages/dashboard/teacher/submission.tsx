import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../../components/AuthContext';
import { Submission as SubmissionBase, Assignment } from "../../../types";



interface Submission extends SubmissionBase {
  analytic?: {
    id: string;
    data: Record<string, {
      status: number;
      file_name: string;
      prompt: string;
      analysis: string;
    }>;
  };
}

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

const isImageFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension);
};

const isPdfFile = (filename: string): boolean => {
  return getFileExtension(filename) === 'pdf';
};

const SubmissionPage = () => {
  const { assignmentId, submissionId } = useParams<{ assignmentId: string; submissionId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileContentLoading, setFileContentLoading] = useState(false);

  const [prompt, setPrompt] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Fetch submission details
  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      try {
        setLoading(true);
        // // First get the assignment to get context
        // const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`, {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // });
        //
        // if (!assignmentResponse.ok) {
        //   throw new Error('Failed to fetch assignment details');
        // }
        //
        // const assignmentData = await assignmentResponse.json();
        // setAssignment({
        //   id: assignmentData.id,
        //   description: assignmentData.description,
        //   dueDate: assignmentData.due_date,
        //   studentIds: assignmentData.student_ids,
        // });
        //
        // Now get the specific submission
        const submissionResponse = await fetch(`/api/assignments/${assignmentId}/submissions/${submissionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!submissionResponse.ok) {
          throw new Error('Failed to fetch submission details');
        }

        const submissionData = await submissionResponse.json();
        setSubmission(submissionData);

        // If there are files, select the first one by default
        if (submissionData.files && submissionData.files.length > 0) {
          setSelectedFileIndex(0);
          fetchFileContent(submissionData.files[0].id);
        }
      } catch (err) {
        console.log(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId && submissionId && token) {
      fetchSubmissionDetails();
    }
  }, [assignmentId, submissionId, token]);

  // Fetch file content
  const fetchFileContent = async (fileId: string) => {
    try {
      setFileContentLoading(true);
      const response = await fetch(`/api/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }

      // Check if we're dealing with a text file or binary file
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.startsWith('text/')) {
        // Handle text content as before
        const content = await response.text();
        setFileContent(content);
      } else {
        // For binary files, we'll set a flag but won't try to read as text
        setFileContent('');
      }
    } catch (err) {
      console.error('Error fetching file content:', err);
      setFileContent('Error loading file content');
    } finally {
      setFileContentLoading(false);
    }
  };

  const handleFileSelect = (index: number) => {
    if (submission?.files && submission.files[index]) {
      setSelectedFileIndex(index);
      fetchFileContent(submission.files[index].id);
    }
  };

  // Initialize analytics for the submission if none exists
  const initializeAnalytics = async () => {
    try {
      const response = await fetch(`/api/analyze/?submission_id=${submissionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize analytics');
      }

      const updatedSubmission = await response.json();
      setSubmission(updatedSubmission);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Failed to initialize analytics');
    }
  };

  // Submit prompt for LLM analysis
  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      setAnalyzeError('Please enter a prompt for analysis');
      return;
    }

    try {
      setAnalyzing(true);
      setAnalyzeError(null);

      // Make sure analytics is initialized
      if (!submission?.analytic) {
        await initializeAnalytics();
      }

      const response = await fetch(`/api/analyze/request?submission_id=${submissionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze submission');
      }

      const analyticData = await response.json();

      // Update submission with new analytic data
      setSubmission(prev => {
        if (!prev) return null;
        return {
          ...prev,
          analytic: analyticData
        };
      });

    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'An unknown error occurred during analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-8">
          <p className="text-text-light">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-error/20 border border-error text-error px-4 py-3 rounded mb-4">
          {error || 'Submission not found'}
        </div>
        <button
          onClick={() => navigate(`/dashboard/assignments`)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-md"
        >
          Back to Assignments
        </button>
      </div>
    );
  }

  const currentFile = submission.files[selectedFileIndex];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate(`/dashboard/assignments/${assignmentId}`)}
          className="mr-4 text-text-muted hover:text-text-primary transition-colors"
        >
          ← Back to Assignments
        </button>
        <h1 className="text-2xl font-bold text-text-primary">
          Submission from {submission.student?.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar with submission details */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-card-dark rounded-lg shadow-md p-5">
            <h2 className="text-xl font-semibold text-text-primary mb-3">Submission Details</h2>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-text-muted">Status</h3>
                {/* <span */}
                {/*   className={`px-2 py-1 rounded text-xs font-medium ${submission.status === 'graded' ? 'bg-success/20 text-success' : */}
                {/*     submission.status === 'submitted' ? 'bg-primary/20 text-primary' : */}
                {/*       submission.status === 'late' ? 'bg-warning/20 text-warning' : */}
                {/*         'bg-accent/20 text-accent' */}
                {/*     }`} */}
                {/* > */}
                {/*   {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)} */}
                {/* </span> */}
              </div>

              {/* <div> */}
              {/*   <h3 className="text-sm font-medium text-text-muted">Submitted</h3> */}
              {/*   <p className="text-text-primary">{new Date(submission.submitted_at).toLocaleString()}</p> */}
              {/* </div> */}

              {/* {submission.status === 'graded' && ( */}
              {/*   <div> */}
              {/*     <h3 className="text-sm font-medium text-text-muted">Grade</h3> */}
              {/*     <p className="text-text-primary font-medium">{submission.grade}/100</p> */}
              {/*   </div> */}
              {/* )} */}
            </div>
          </div>

          {/* File list */}
          <div className="bg-card-dark rounded-lg shadow-md p-5">
            <h2 className="text-xl font-semibold text-text-primary mb-3">Files</h2>
            {submission.files.length === 0 ? (
              <p className="text-text-muted">No files submitted.</p>
            ) : (
              <div className="space-y-2">
                {submission.files.map((file, index) => (
                  <div
                    key={file.id}
                    onClick={() => handleFileSelect(index)}
                    className={`p-3 rounded cursor-pointer transition-colors ${selectedFileIndex === index
                      ? 'bg-primary/20 border border-primary'
                      : 'hover:bg-background-dark'
                      }`}
                  >
                    <h3 className="font-medium text-text-primary">{file.filename}</h3>
                    {/* <p className="text-text-muted text-sm">{(file.size / 1024).toFixed(2)} KB</p> */}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grading action */}
          {/* <div className="bg-card-dark rounded-lg shadow-md p-5"> */}
          {/*   <Link */}
          {/*     to={`/dashboard/teacher/submissions/${assignmentId}/grade/${submissionId}`} */}
          {/*     className="block w-full px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-md transition-colors text-center" */}
          {/*   > */}
          {/*     {submission.status === 'graded' ? 'Edit Grade' : 'Grade Submission'} */}
          {/*   </Link> */}
          {/* </div> */}
        </div>

        {/* Main content area */}
        <div className="md:col-span-2 space-y-4">
          {/* File content */}
          <div className="bg-card-dark rounded-lg shadow-md p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-text-primary">
                {currentFile ? currentFile.filename : 'No file selected'}
              </h2>
              {currentFile && (
                <a
                  href={`/api/files/${currentFile.id}`}
                  download={currentFile.filename}
                  className="px-3 py-1 bg-primary hover:bg-primary-hover text-text-primary rounded-md text-sm"
                >
                  Download
                </a>
              )}
            </div>

            {fileContentLoading ? (
              <div className="text-center py-8">
                <p className="text-text-light">Loading file content...</p>
              </div>
            ) : (
              <div className="bg-background-dark p-4 rounded border border-secondary">
                {currentFile && isPdfFile(currentFile.filename) ? (
                  <embed
                    src={`/api/files/${currentFile.id}`}
                    type="application/pdf"
                    width="100%"
                    height="600px"
                    className="rounded"
                  />
                ) : currentFile && isImageFile(currentFile.filename) ? (
                  <img
                    src={`/api/files/${currentFile.id}`}
                    alt={currentFile.filename}
                    className="max-w-full max-h-96 mx-auto"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-text-primary font-mono text-sm overflow-x-auto max-h-96">
                    {fileContent || 'This file type cannot be previewed directly. Click the download button to view.'}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* LLM Analysis */}
          <div className="bg-card-dark rounded-lg shadow-md p-5">
            <h2 className="text-xl font-semibold text-text-primary mb-3">AI Analysis</h2>

            <div className="mb-4">
              <label htmlFor="prompt" className="block text-sm font-medium text-text-muted mb-1">
                Enter your prompt for AI analysis
              </label>
              <textarea
                id="prompt"
                rows={3}
                className="w-full bg-background-dark border border-secondary rounded-md p-2 text-text-primary"
                placeholder="e.g., Analyze this code for bugs, Summarize the main concepts in this essay..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {analyzeError && (
              <div className="bg-error/20 border border-error text-error px-4 py-3 rounded mb-4">
                {analyzeError}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !prompt.trim()}
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-text-primary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>

            {/* Results */}
            {submission.analytic && Object.keys(submission.analytic.data).length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-text-primary mb-2">Analysis Results</h3>
                <div className="space-y-3">
                  {Object.entries(submission.analytic.data).map(([filename, result]) => (
                    <div key={filename} className="bg-background-dark p-3 rounded border border-secondary">
                      <h4 className="font-medium text-text-primary mb-1">{filename}</h4>
                      <p className="text-text-muted text-sm mb-2">Prompt: {result.prompt}</p>
                      <div className="bg-background p-3 rounded whitespace-pre-wrap text-text-light">
                        {result.analysis}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionPage;
