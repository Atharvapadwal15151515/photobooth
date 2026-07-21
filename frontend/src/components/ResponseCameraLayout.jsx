import CameraCapture from "./CameraCapture";
import CreatorReferencePhoto from "./CreatorReferencePhoto";

function ResponseCameraLayout({
  creatorPhoto,
  photoNumber,
  isLoadingReference,
  onCapture,
  disabled,
  buttonText,
}) {
  return (
    <div className="response-camera-layout">
      <CreatorReferencePhoto
        photo={creatorPhoto}
        photoNumber={photoNumber}
        isLoading={isLoadingReference}
      />

      <div className="response-camera-panel">
        <span className="response-camera-label">
          Your response
        </span>

        <CameraCapture
          onCapture={onCapture}
          disabled={disabled}
          buttonText={buttonText}
        />
      </div>
    </div>
  );
}

export default ResponseCameraLayout;