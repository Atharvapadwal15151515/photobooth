import { Route, Routes } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import CreateBoothPage from "../pages/CreateBoothPage";
import CreatorCameraPage from "../pages/CreatorCameraPage";
import InvitePage from "../pages/InvitePage";
import RecipientCameraPage from "../pages/RecipientCameraPage";
import WaitingPage from "../pages/WaitingPage";
import FinalCardPage from "../pages/FinalCardPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/create" element={<CreateBoothPage />} />

      <Route
        path="/booth/:boothId/creator/:participantId"
        element={<CreatorCameraPage />}
      />

      <Route
        path="/invite/:inviteToken"
        element={<InvitePage />}
      />

      <Route
        path="/booth/:boothId/recipient/:participantId"
        element={<RecipientCameraPage />}
      />

      <Route
        path="/booth/:boothId/waiting"
        element={<WaitingPage />}
      />

      <Route
        path="/booth/:boothId/card"
        element={<FinalCardPage />}
      />

      <Route
        path="*"
        element={
          <main className="page-container">
            <section className="error-card">
              <h1>Page not found</h1>
              <p>The page you are looking for does not exist.</p>
            </section>
          </main>
        }
      />
    </Routes>
  );
}

export default AppRoutes;