import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function LandingPage() {
  return (
    <>
      <Navbar />

      <main className="landing-page">
        <section className="landing-hero">
          <div className="landing-content">
            <span className="landing-badge">
              Create memories from anywhere
            </span>

            <h1>
              A photo booth experience for you and someone special.
            </h1>

            <p>
              Take your photos, send an invite link, and let your friend add
              their photos later. We will combine them into one final card.
            </p>

            <div className="landing-actions">
              <Link to="/create" className="primary-button">
                Create a Photo Booth
              </Link>
            </div>
          </div>

          <div className="landing-preview">
            <div className="preview-card">
              <div className="preview-title">
                <span>Happy Birthday!</span>
                <strong>Harshita & Sakshi</strong>
              </div>

              <div className="preview-photo-grid">
                {Array.from({ length: 8 }, (_, index) => (
                  <div className="preview-photo-box" key={index}>
                    <span>{index + 1}</span>
                  </div>
                ))}
              </div>

              <p>Memories made together, even from different places.</p>
            </div>
          </div>
        </section>

        <section className="how-it-works">
          <div className="section-heading">
            <span>How it works</span>
            <h2>Three simple steps</h2>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">1</span>
              <h3>Create your booth</h3>
              <p>
                Add the recipient's name, occasion, message, and choose the
                number of photos.
              </p>
            </article>

            <article className="step-card">
              <span className="step-number">2</span>
              <h3>Take your photos</h3>
              <p>
                Use your camera directly from the browser. No saved media is
                required.
              </p>
            </article>

            <article className="step-card">
              <span className="step-number">3</span>
              <h3>Share the invite</h3>
              <p>
                Your friend takes their photos later, and the final card is
                generated automatically.
              </p>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}

export default LandingPage;