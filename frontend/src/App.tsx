import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router"

// components
import Home from './pages/Home'
import Login from './pages/auth/login'
import Signup from './pages/auth/signup'
import AuthLayout from './pages/auth/layout'
import TeacherDashboard from './pages/dashboard/teacher/teacher'
import StudentDashboard from './pages/dashboard/student/student'
import { AuthProvider, useAuth } from './components/AuthContext'
import DashboardLayout from './pages/dashboard/layout'
import StudentAssignment from './pages/dashboard/student/assignment'
import TeacherAssignment from './pages/dashboard/teacher/assignment'
import CreateAssignment from './pages/dashboard/teacher/createassignment'
import Submissions from './pages/dashboard/teacher/submissions'
import Submission from './pages/dashboard/teacher/submission'


const DashboardRedirect = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background-dark">Loading...</div>;
  }


  if (!user) {
    console.log("user not logged in");
    return <Navigate to="/login" replace />

  }

  return user?.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />
}

const AssignmentRedirect = () => {

  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background-dark">Loading...</div>;
  }


  if (!user) {
    console.log("user not logged in");
    return <Navigate to="/login" replace />

  }

  return user?.role === "teacher" ? <TeacherAssignment /> : <StudentAssignment />
}

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />

          <Route element={<AuthLayout />}>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route path="dashboard" element={<DashboardLayout />} >
            <Route index element={<DashboardRedirect />} />
            <Route path="assignments/:assignmentId" element={<AssignmentRedirect />} />
            <Route path="createassignment" element={<CreateAssignment />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="assignments/:assignmentId/submissions/:submissionId" element={<Submission />} />

          </Route>
        </Routes>
      </BrowserRouter>
      {/* <AuthProvider> */}
      {/* </AuthProvider> */}

    </AuthProvider>
  )
}

export default App
