
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import RiskAssessment from "./pages/RiskAssessment";
import Interventions from "./pages/Interventions";
import Analytics from "./pages/Analytics";

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#F5F6F0]">
      <Sidebar />

      <main className="flex-1 min-w-0">
        <Header />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/assessment" element={<RiskAssessment />} />
          <Route path="/interventions" element={<Interventions />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
