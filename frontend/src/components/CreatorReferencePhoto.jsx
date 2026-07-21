import { getPhotoUrl } from "../utils/photoHelpers";

function CreatorReferencePhoto({
  photo,
  photoNumber,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="creator-reference-card">
        <p>Loading creator photo...</p>
      </div>
    );
  }

  const photoUrl = getPhotoUrl(photo);

  if (!photoUrl) {
    return (
      <div className="creator-reference-card">
        <p>Creator photo {photoNumber} is unavailable.</p>
      </div>
    );
  }

  return (
    <section className="creator-reference-card">
      <span className="creator-reference-label">
        Creator photo {photoNumber}
      </span>

      <img
        src={photoUrl}
        alt={`Creator reference ${photoNumber}`}
        className="creator-reference-image"
      />

      <p>Match the pose or take a reaction photo.</p>
    </section>
  );
}

export default CreatorReferencePhoto;