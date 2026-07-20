import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import LoadingScreen from "../components/LoadingScreen";
import { getBoothById, getGeneratedCard } from "../api/api";

function FinalCardPage() {
  const { boothId } = useParams();

  const [card, setCard] = useState(null);
  const [booth, setBooth] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadCard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const boothResponse = await getBoothById(boothId);
      const boothData = boothResponse.data || boothResponse;

      setBooth(boothData);

      try {
        const cardResponse = await getGeneratedCard(boothId);
        const cardData = cardResponse.data || cardResponse;

        setCard(cardData.generatedCard || cardData);
      } catch {
        setCard(boothData.generatedCard || null);
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to load this photo booth.");
    } finally {
      setIsLoading(false);
    }
  }, [boothId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  const cardUrl =
    card?.card_url ||
    card?.image_url ||
    card?.generated_card_url ||
    card?.url;

  if (isLoading) {
    return <LoadingScreen message="Loading the final card..." />;
  }

  return (
    <>
      <Navbar />

      <main className="page-container">
        <section className="final-card-page">
          {error ? (
            <div className="error-card">
              <h1>Unable to open the card</h1>
              <p>{error}</p>

              <button
                type="button"
                className="primary-button"
                onClick={loadCard}
              >
                Try Again
              </button>
            </div>
          ) : cardUrl ? (
            <>
              <div className="page-heading">
                <span>Photo booth completed</span>
                <h1>{booth?.title || "Your final photo card"}</h1>
                <p>
                  {booth?.creator_name} and {booth?.recipient_name} created
                  this card together.
                </p>
              </div>

              <div className="final-card-wrapper">
                <img
                  src={cardUrl}
                  alt={booth?.title || "Generated photo booth card"}
                  className="final-card-image"
                />
              </div>

              <div className="page-actions">
                <a
                  href={cardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="primary-button"
                >
                  Open Full Image
                </a>

                <Link to="/" className="secondary-button">
                  Create Another Booth
                </Link>
              </div>
            </>
          ) : (
            <div className="waiting-card">
              <div className="waiting-icon">⌛</div>

              <span className="waiting-label">
                Waiting for the other person
              </span>

              <h1>The final card is not ready yet</h1>

              <p>
                The recipient may still need to complete their photo session.
                Refresh this page after they finish.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={loadCard}
              >
                Check Again
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default FinalCardPage;