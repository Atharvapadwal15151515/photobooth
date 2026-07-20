import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

function WaitingPage() {
  const { boothId } = useParams();

  const storedBooth = useMemo(
    () => JSON.parse(localStorage.getItem("currentBooth") || "{}"),
    []
  );

  const [copied, setCopied] = useState(false);

  const inviteUrl = storedBooth.inviteToken
    ? `${window.location.origin}/invite/${storedBooth.inviteToken}`
    : "";

  const handleCopy = async () => {
    if (!inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (!inviteUrl) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my photo booth",
          text: `${storedBooth.creatorName || "Someone"} invited you to a shared photo booth.`,
          url: inviteUrl,
        });
      } catch {
        return;
      }
    } else {
      await handleCopy();
    }
  };

  return (
    <>
      <Navbar />

      <main className="page-container">
        <section className="waiting-page">
          <div className="waiting-card">
            <div className="waiting-icon">✓</div>

            <span className="waiting-label">Your photos are complete</span>

            <h1>Send the invitation to {storedBooth.recipientName}</h1>

            <p>
              Your photos have been saved. The final card will be generated
              after the recipient takes their photos.
            </p>

            {inviteUrl ? (
              <>
                <div className="invite-link-box">
                  <input type="text" value={inviteUrl} readOnly />

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleCopy}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="waiting-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleShare}
                  >
                    Share Invitation
                  </button>

                  <Link
                    to={`/booth/${boothId}/card`}
                    className="secondary-button"
                  >
                    Check Final Card
                  </Link>
                </div>
              </>
            ) : (
              <p className="form-error">
                Invite token is missing. Create a new booth and try again.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default WaitingPage;