import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuthStore } from "@/store/auth-store";

describe("ProtectedRoute", () => {
  afterEach(() => {
    act(() => {
      useAuthStore.setState({ session: null, expiredMessage: null });
    });
  });

  it("redirects unauthenticated users", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    act(() => {
      useAuthStore.setState({
        session: {
          accessToken: "token",
          user: { id: "u1", displayName: "Aarav", email: "demo@example.com" },
        },
      });
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
