import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router"

// components
import Home from './pages/Home'
import Login from './pages/auth/login'
import Signup from './pages/auth/signup'
import AuthLayout from './pages/auth/layout'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />

          <Route element={<AuthLayout />}>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
          </Route>
        </Routes>
      </BrowserRouter>
      {/* <AuthProvider> */}
      {/* </AuthProvider> */}

    </>
  )
}

export default App
