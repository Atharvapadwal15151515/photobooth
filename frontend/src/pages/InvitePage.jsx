import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LoadingScreen from "../components/LoadingScreen";
import { getBoothByInviteToken } from "../api/api";

function InvitePage() {
  const navigate = useNavigate();
  const { inviteToken } = useParams();

  const [booth, setBooth] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBooth = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getBoothByInviteToken(inviteToken);
        const result = response.data || response;

        const participants = result.participants || [];

        const recipientParticipant = participants.find(
          (participant) => participant.role === "recipient"
        );

        if (!recipientParticipant) {
          throw new Error("Recipient information is missing.");
        }

        setBooth(result);
        setRecipient(recipientParticipant);
      } catch (requestError) {
        setError(requestError.message || "This invitation is invalid.");
      } finally {
        setIsLoading(false);
      }
    };

    loadBooth();
  }, [inviteToken]);

  const handleJoin = () => {
    localStorage.setItem(
      "recipientBooth",
      JSON.stringify({
        boothId: booth.booth_id,
        participantId: recipient.participant_id,
        photoCount: booth.photo_count,
        creatorName: booth.creator_name,
        recipientName: booth.recipient_name,
        title: booth.title,
        inviteToken,
      })
    );

    navigate(
      `/booth/${booth.booth_id}/recipient/${recipient.participant_id}`
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Opening your invitation..." />;
  }

  return (
    <>
      <Navbar />

      <main className="page-container">
        <section className="invite-page">
          {error ? (
            <div className="error-card">
              <h1>Invitation unavailable</h1>
              <p>{error}</p>
            </div>
          ) : (
            <div className="invite-card">
              <span className="invite-label">
                A photo booth invitation for
              </span>

              <h1>{booth.recipient_name}</h1>

              <h2>{booth.title}</h2>

              {booth.message && (
                <p className="invite-message">{booth.message}</p>
              )}

              <div className="invite-details">
                <div>
                  <span>Created by</span>
                  <strong>{booth.creator_name}</strong>
                </div>

                <div>
                  <span>Your photos</span>
                  <strong>{booth.photo_count}</strong>
                </div>

                <div>
                  <span>Theme</span>
                  <strong>{booth.theme}</strong>
                </div>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={handleJoin}
              >
                Open Camera and Join
              </button>

              <p className="camera-permission-note">
                Your browser will ask for camera permission.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default InvitePage;