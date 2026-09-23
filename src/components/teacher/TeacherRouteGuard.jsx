import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function TeacherRouteGuard({ children }) {
  const { currentTeacher } = useApp();
  const location = useLocation();

  if (!currentTeacher) {
    return <Navigate to="/teacher/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
