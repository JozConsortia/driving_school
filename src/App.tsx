import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { SearchSchools } from "./pages/learner/SearchSchools";
import { SchoolProfile } from "./pages/learner/SchoolProfile";
import { LearnerSchedule } from "./pages/learner/LearnerSchedule";
import { SchoolDashboard } from "./pages/school/SchoolDashboard";
import { InstructorDashboard } from "./pages/instructor/InstructorDashboard";
import { AdminDashboard } from "./pages/admin/AdminDashboard";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<SearchSchools />} />
          <Route path="/schools/:id" element={<SchoolProfile />} />

          <Route
            path="/learner/schedule"
            element={
              <ProtectedRoute roles={["LEARNER"]}>
                <LearnerSchedule />
              </ProtectedRoute>
            }
          />

          <Route
            path="/school"
            element={
              <ProtectedRoute roles={["SCHOOL_ADMIN"]}>
                <SchoolDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor"
            element={
              <ProtectedRoute roles={["INSTRUCTOR"]}>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["SYSTEM_ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
