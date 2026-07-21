import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import LoadingScreen from "../components/LoadingScreen";

import {
  getBoothById,
  getGeneratedCard,
} from "../api/api";

function FinalCardPage() {
  const { boothId } = useParams();

  const [card, setCard] = useState(null);
  const [booth, setBooth] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const extractBooth = (response) => {
    return (
      response?.booth ??
      response?.data?.booth ??
      response?.data ??
      response ??
      null
    );
  };

  const extractCard = (response) => {
    return (
      response?.generatedCard ??
      response?.generated_card ??
      response?.card ??
      response?.data?.generatedCard ??
      response?.data?.generated_card ??
      response?.data?.card ??
      response?.data ??
      response ??
      null
    );
  };

  const loadCard = useCallback(async () => {
    if (!boothId) {
      setError("Booth ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const [boothResult, cardResult] =
        await Promise.allSettled([
          getBoothById(boothId),
          getGeneratedCard(boothId),
        ]);

      if (boothResult.status === "fulfilled") {
        setBooth(extractBooth(boothResult.value));
      } else {
        console.error(
          "Unable to load booth:",
          boothResult.reason
        );
      }

      if (cardResult.status === "fulfilled") {
        const generatedCard = extractCard(
          cardResult.value
        );

        console.log(
          "Generated card received:",
          generatedCard
        );

        setCard(generatedCard);
      } else {
        const status =
          cardResult.reason?.response?.status;

        console.error(
          "Unable to load generated card:",
          cardResult.reason
        );

        setCard(null);

        if (status !== 404) {
          throw cardResult.reason;
        }
      }

      if (
        boothResult.status === "rejected" &&
        cardResult.status === "rejected"
      ) {
        throw (
          boothResult.reason ??
          cardResult.reason
        );
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ??
          requestError?.response?.data?.error ??
          requestError?.message ??
          "Unable to load this photo booth."
      );
    } finally {
      setIsLoading(false);
    }
  }, [boothId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  const cardUrl =
    card?.final_image_url ??
    card?.finalImageUrl ??
    card?.card_url ??
    card?.image_url ??
    card?.generated_card_url ??
    card?.url ??
    null;

  const boothTitle =
    booth?.title ||
    "Your final photo card";

  const creatorName =
    booth?.creator_name ??
    booth?.creatorName ??
    "Creator";

  const recipientName =
    booth?.recipient_name ??
    booth?.recipientName ??
    "Recipient";

  if (isLoading) {
    return (
      <LoadingScreen message="Loading the final card..." />
    );
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

                <h1>{boothTitle}</h1>

                <p>
                  {creatorName} and {recipientName} created
                  this card together.
                </p>
              </div>

              <div className="final-card-wrapper">
                <img
                  src={cardUrl}
                  alt={boothTitle}
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

                <Link
                  to="/"
                  className="secondary-button"
                >
                  Create Another Booth
                </Link>
              </div>
            </>
          ) : (
            <div className="waiting-card">
              <div className="waiting-icon">
                ⌛
              </div>

              <span className="waiting-label">
                Waiting for the other person
              </span>

              <h1>
                The final card is not ready yet
              </h1>

              <p>
                Both people must complete their photo
                sessions before the card can be generated.
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