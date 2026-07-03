import React, { createContext, useContext } from "react";

const AdminAuthContext = createContext({ role: null, isReadOnly: true, basePath: "/admin" });

export const AdminAuthProvider = ({ role, children }) => {
  const isReadOnly = role === "admin";
  const basePath =
    role === "platform_manager"
      ? "/platform-manager"
      : "/admin-view";
  return (
    <AdminAuthContext.Provider value={{ role, isReadOnly, basePath }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
