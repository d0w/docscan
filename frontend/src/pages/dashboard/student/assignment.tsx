import { useParams, useNavigate } from "react-router"
import { useEffect, useState } from "react"
import { useAuth } from "../../../components/AuthContext";
import { Assignment, File } from "../../../types";

const AssignmentPage = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user, isLoading, token } = useAuth();
  const [assignment, setAssignment] = useState<Assignment>({} as Assignment);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getAssignment = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/assignments/${assignmentId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        const data = await response.json();
        setAssignment({
          id: data.id,
          title: data.title,
          description: data.description,
          dueDate: data.due_date,
        } as Assignment);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }


    }

    const getSubmittedFiles = async () => {
      try {
        const response = await fetch(`/api/assignments/${assignmentId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }


        const data = await response.json();
        console.log(data);
        const files = data.submissions.map((submission: any) => submission.files).flat();
        setUploadedFiles(files);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }

    if (token) {
      getAssignment();
    }

    if (assignmentId && token) {
      getSubmittedFiles();
    }
  }, [token, assignmentId]);



  const handleFileUpload = async (files: any): Promise<any> => {
    try {
      setLoading(true);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      })

      formData.append("assignment_id", assignmentId || "");

      const response = await fetch('/api/assignments/submit', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const data = await response.json();
      setUploadedFiles(prev => [...prev, ...data?.files]);


    } catch (err) {
      console.log(err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  }

  const handleFileSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (selectedFiles.length > 0) {
      handleFileUpload(selectedFiles);
    }
  }


  return (
    <div className="p-6 max-w-4xl mx-auto">
      {loading && (
        <div className="text-center py-4 text-text-light">Loading...</div>
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

      {assignment.id && (
        <div className="bg-card-dark shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2 text-text-primary">{assignment.title}</h1>
          <p className="text-text-muted mb-4">
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </p>
          <div className="prose max-w-none mb-6 text-text-light">
            <p>{assignment.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Submit Assignment</h2>


            <div className="mb-6">
              <label className="block text-text-light mb-2">Upload Files</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-text-muted
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-text-primary
                  hover:file:bg-primary-hover
                  mb-4"
              />
              <button
                onClick={handleFileSubmit}
                className="py-2 px-4 bg-primary hover:bg-primary-hover text-text-primary rounded transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedFiles.length === 0}
              >
                Submit Files
              </button>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2 text-text-light">Uploaded Files</h3>
              <ul className="divide-y divide-secondary/30">
                {uploadedFiles.map((file) => (
                  <li key={file.id} className="py-3 flex justify-between items-center">
                    <span className="text-text-primary">{file.filename}</span>
                    <span className="text-sm text-text-muted">
                      {new Date(file.updatedAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
      }
    </div >
  )
}

export default AssignmentPage
