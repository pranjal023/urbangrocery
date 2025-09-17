import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { validToken } from '../utils/jwt'

export default function RequireAuth({ children }) {
  const token = validToken()
  const loc = useLocation()
  if (!token) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return children
}
