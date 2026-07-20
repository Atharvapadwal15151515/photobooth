function PhotoPreview({
  photos = [],
  requiredCount = 4,
  onRetake,
  onRemove,
  showActions = true,
}) {
  const previewSlots = Array.from(
    { length: requiredCount },
    (_, index) => photos[index] || null
  );

  return (
    <section className="photo-preview-section">
      <div className="photo-preview-header">
        <div>
          <h2>Your Photos</h2>
          <p>
            {photos.length} of {requiredCount} photos captured
          </p>
        </div>

        <span className="photo-count-badge">
          {photos.length}/{requiredCount}
        </span>
      </div>

      <div className="photo-preview-grid">
        {previewSlots.map((photo, index) => (
          <article
            className={`photo-preview-card ${
              photo ? "photo-preview-filled" : "photo-preview-empty"
            }`}
            key={photo?.id || photo?.previewUrl || index}
          >
            {photo ? (
              <>
                <img
                  src={photo.previewUrl || photo.image_url}
                  alt={`Captured photo ${index + 1}`}
                  className="photo-preview-image"
                />

                <span className="photo-number">{index + 1}</span>

                {showActions && (
                  <div className="photo-preview-actions">
                    {onRetake && (
                      <button
                        type="button"
                        className="photo-action-button"
                        onClick={() => onRetake(index)}
                      >
                        Retake
                      </button>
                    )}

                    {onRemove && (
                      <button
                        type="button"
                        className="photo-action-button danger-button"
                        onClick={() => onRemove(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-photo-content">
                <span className="empty-photo-number">{index + 1}</span>
                <p>Photo not taken</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default PhotoPreview;