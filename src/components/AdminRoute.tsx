import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const admins = (import.meta as any).env?.VITE_ADMIN_EMAILS?.split(",")
  .map((s: string) => s.trim().toLowerCase()).filter(Boolean) || [];

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const email = currentUser?.email?.toLowerCase?.();
  const isAdmin = (currentUser as any)?.role === "admin" || (email && admins.includes(email));
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default AdminRoute;
