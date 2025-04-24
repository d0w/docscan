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

          <Route element={<DashboardLayout />} >
            <Route path="/dashboard" element={<DashboardRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter>
      {/* <AuthProvider> */}
      {/* </AuthProvider> */}

    </AuthProvider>
  )
}

export default App
