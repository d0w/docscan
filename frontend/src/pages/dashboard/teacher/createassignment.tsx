import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../components/AuthContext';
import { User } from '../../../types';

const CreateAssignment = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Students data
  const [students, setStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Calculate tomorrow's date for min attribute of date input
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const response = await fetch('/api/users/students', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }

        const data = await response.json();
        const students: User[] = data.map((student: any) => ({
          name: student.name,
          id: student.id,
          username: student.username
        }));

        console.log(students);
        setStudents(students);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [token]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title || !description || !dueDate) {
      setError('Please fill out all required fields');
      return;
    }

    if (selectedStudents.length === 0) {
      setError('Please select at least one student for this assignment');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/assignments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          due_date: dueDate,
          student_ids: selectedStudents
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create assignment');
      }

      // Navigate back to teacher dashboard on success
      navigate('/dashboard');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student.id));
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/dashboard/')}
          className="mr-4 text-text-muted hover:text-text-primary transition-colors"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Create New Assignment</h1>
      </div>

      {error && (
        <div className="bg-error/20 border border-error text-error px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card-dark rounded-lg p-6 shadow-md">
        <div className="mb-4">
          <label htmlFor="title" className="block text-text-light mb-1">Title <span className="text-error">*</span></label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded bg-background-dark border border-secondary focus:border-primary focus:outline-none text-text-primary"
            placeholder="Assignment title"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-text-light mb-1">Description <span className="text-error">*</span></label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 rounded bg-background-dark border border-secondary focus:border-primary focus:outline-none text-text-primary min-h-[150px]"
            placeholder="Provide detailed instructions for this assignment"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="dueDate" className="block text-text-light mb-1">Due Date <span className="text-error">*</span></label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={tomorrowString}
            className="w-full p-2 rounded bg-background-dark border border-secondary focus:border-primary focus:outline-none text-text-primary"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-text-light mb-2">
            Assign Students <span className="text-error">*</span>
          </label>

          {loadingStudents ? (
            <div className="text-text-muted text-sm py-2">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-text-muted text-sm py-2">No students available</div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-muted text-sm">
                  {selectedStudents.length} of {students.length} students selected
                </span>
                <button
                  type="button"
                  onClick={toggleAllStudents}
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-[200px] overflow-y-auto border border-secondary rounded bg-background-dark p-1">
                {students.map(student => (
                  <div
                    key={student.id}
                    className="flex items-center p-2 hover:bg-card-dark transition-colors rounded"
                  >
                    <input
                      type="checkbox"
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`student-${student.id}`}
                      className="flex-grow cursor-pointer"
                    >
                      {student.name} <span className="text-text-muted text-sm">({student.username})</span>
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/dashboard/')}
            className="px-4 py-2 mr-2 bg-secondary hover:bg-secondary-hover text-text-primary rounded-md transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-md transition-colors disabled:opacity-70"
            disabled={loading || loadingStudents}
          >
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssignment;

