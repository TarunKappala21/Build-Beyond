import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

vi.mock("./Pages/login-signup/LoginSignUp", () => ({
  default: () => <div>Login Page</div>,
}));
vi.mock("./Pages/admin/AdminLogin", () => ({
  default: () => <div>Admin Login Page</div>,
}));
vi.mock("./Pages/admin/PlatformManagerLogin", () => ({
  default: () => <div>Platform Manager Login Page</div>,
}));
vi.mock("./Pages/customer/Customer", () => ({
  default: () => <div>Customer Dashboard</div>,
}));
vi.mock("./Pages/company/Company", () => ({
  default: () => <div>Company Dashboard</div>,
}));
vi.mock("./Pages/worker/Worker", () => ({
  default: () => <div>Worker Dashboard</div>,
}));
vi.mock("./Pages/admin/Admin", () => ({
  default: () => <div>Admin Dashboard</div>,
}));
vi.mock("./Pages/platformmanager/PlatformManager", () => ({
  default: () => <div>Platform Manager Dashboard</div>,
}));
vi.mock("./Pages/NotFound", () => ({
  default: () => <div>Not Found Page</div>,
}));
vi.mock("./Pages/Unauthorized", () => ({
  default: () => <div>Unauthorized Page</div>,
}));
vi.mock("./components/ProtectedRoute", () => ({
  default: ({ children }) => <>{children}</>,
}));
vi.mock("./components/AdminProtectedRoute", () => ({
  default: ({ children }) => <>{children}</>,
}));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App route smoke tests", () => {
  const routeCases = [
    ["/", "Login Page"],
    ["/admin-login", "Admin Login Page"],
    ["/platform-manager-login", "Platform Manager Login Page"],
    ["/customerdashboard", "Customer Dashboard"],
    ["/customerdashboard/", "Customer Dashboard"],
    ["/customerdashboard/profile", "Customer Dashboard"],
    ["/customerdashboard/projects", "Customer Dashboard"],
    ["/customerdashboard/jobs", "Customer Dashboard"],
    ["/customerdashboard/settings", "Customer Dashboard"],
    ["/customerdashboard/ongoing", "Customer Dashboard"],
    ["/customerdashboard/history", "Customer Dashboard"],
    ["/companydashboard", "Company Dashboard"],
    ["/companydashboard/", "Company Dashboard"],
    ["/companydashboard/projects", "Company Dashboard"],
    ["/companydashboard/revenue", "Company Dashboard"],
    ["/companydashboard/hiring", "Company Dashboard"],
    ["/companydashboard/bids", "Company Dashboard"],
    ["/companydashboard/settings", "Company Dashboard"],
    ["/companydashboard/employees", "Company Dashboard"],
    ["/workerdashboard", "Worker Dashboard"],
    ["/workerdashboard/", "Worker Dashboard"],
    ["/workerdashboard/jobs", "Worker Dashboard"],
    ["/workerdashboard/ongoing", "Worker Dashboard"],
    ["/workerdashboard/settings", "Worker Dashboard"],
    ["/workerdashboard/profile", "Worker Dashboard"],
    ["/workerdashboard/my-company", "Worker Dashboard"],
    ["/admin-view", "Admin Dashboard"],
    ["/admin-view/", "Admin Dashboard"],
    ["/admin-view/users", "Admin Dashboard"],
    ["/admin-view/revenue", "Admin Dashboard"],
    ["/admin-view/analytics", "Admin Dashboard"],
    ["/admin-view/settings", "Admin Dashboard"],
    ["/platform-manager", "Platform Manager Dashboard"],
    ["/platform-manager/", "Platform Manager Dashboard"],
    ["/platform-manager/dashboard", "Platform Manager Dashboard"],
    ["/platform-manager/verification", "Platform Manager Dashboard"],
    ["/platform-manager/payments", "Platform Manager Dashboard"],
    ["/platform-manager/complaints", "Platform Manager Dashboard"],
    ["/not-found", "Not Found Page"],
    ["/unauthorized", "Unauthorized Page"],
    ["/some-random-route", "Not Found Page"],
    ["/random", "Not Found Page"],
    ["/unknown/path", "Not Found Page"],
    ["/admin", "Not Found Page"],
    ["/customer", "Not Found Page"],
    ["/company", "Not Found Page"],
    ["/worker", "Not Found Page"],
    ["/platform", "Not Found Page"],
    ["/__invalid__", "Not Found Page"],
    ["/....", "Not Found Page"],
    ["/123", "Not Found Page"],
    ["/abc/def/ghi", "Not Found Page"],
  ];

  it.each(routeCases)("renders expected page for route %s", (route, expected) => {
    renderAt(route);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
