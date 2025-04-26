import React from "react"
import { Link } from "react-router"
import { Outlet } from "react-router"

const AuthLayout = () => {
  return (
    <div className="p-10">
      <Link className="text-4xl font-bold" to="/">DocScan</Link>
      <Outlet />
    </div >
  )
}

export default AuthLayout
