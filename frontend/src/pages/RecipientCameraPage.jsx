import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import CameraCapture from "../components/CameraCapture";
import PhotoPreview from "../components/PhotoPreview";
import {
  completeParticipant,
  deletePhoto,
  generateCard,
  uploadPhoto,
} from "../api/api";

function RecipientCameraPage() {
  const navigate = useNavigate();
  const { boothId, participantId } = useParams();

  const storedBooth = JSON.parse(
    localStorage.getItem("recipientBooth") || "{}"
  );

  const requiredCount = Number(storedBooth.photoCount || 4);

  const [photos, setPhotos] = useState([]);
  const [captureIndex, setCaptureIndex] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
    };
  }, [photos]);

  const handleCapture = async ({ file, previewUrl }) => {
    if (isUploading) {
      URL.revokeObjectURL(previewUrl);
      return;
    }

    const photoNumber =
      captureIndex !== null ? captureIndex + 1 : photos.length + 1;

    if (photoNumber > requiredCount) {
      URL.revokeObjectURL(previewUrl);
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      if (captureIndex !== null && photos[captureIndex]?.photo_id) {
        await deletePhoto(photos[captureIndex].photo_id);
      }

      const response = await uploadPhoto({
        image: file,
        boothId,
        participantId,
        photoNumber,
      });

      const uploadedPhoto = response.data || response;

      const photoRecord = {
        ...uploadedPhoto,
        previewUrl,
        file,
      };

      setPhotos((currentPhotos) => {
        if (captureIndex !== null) {
          const updatedPhotos = [...currentPhotos];

          const oldPreview = updatedPhotos[captureIndex]?.previewUrl;

          if (oldPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(oldPreview);
          }

          updatedPhotos[captureIndex] = photoRecord;
          return updatedPhotos;
        }

        return [...currentPhotos, photoRecord];
      });

      setCaptureIndex(null);
    } catch (requestError) {
      URL.revokeObjectURL(previewUrl);
      setError(requestError.message || "Unable to upload the photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = (index) => {
    setCaptureIndex(index);
    setError("");
  };

  const handleRemove = async (index) => {
    const photo = photos[index];

    try {
      setError("");

      if (photo.photo_id) {
        await deletePhoto(photo.photo_id);
      }

      if (photo.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(photo.previewUrl);
      }

      setPhotos((currentPhotos) =>
        currentPhotos.filter((_, photoIndex) => photoIndex !== index)
      );

      setCaptureIndex(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to remove the photo.");
    }
  };

  const handleComplete = async () => {
    if (photos.length !== requiredCount) {
      setError(`Take all ${requiredCount} photos before continuing.`);
      return;
    }

    try {
      setIsCompleting(true);
      setError("");

      await completeParticipant(participantId);
      await generateCard(boothId);

      navigate(`/booth/${boothId}/card`);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Your photos were saved, but the final card could not be generated."
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const cameraDisabled =
    isUploading ||
    isCompleting ||
    (photos.length >= requiredCount && captureIndex === null);

  return (
    <>
      <Navbar />

      <main className="page-container">
        <section className="camera-page">
          <div className="page-heading">
            <span>Recipient photos</span>

            <h1>
              {storedBooth.recipientName
                ? `${storedBooth.recipientName}, it is your turn`
                : "It is your turn"}
            </h1>

            <p>
              Take {requiredCount} photos. After you finish, the shared card
              will be generated.
            </p>
          </div>

          {captureIndex !== null && (
            <div className="retake-notice">
              Retaking photo {captureIndex + 1}
            </div>
          )}

          <CameraCapture
            onCapture={handleCapture}
            disabled={cameraDisabled}
            buttonText={
              isUploading
                ? "Uploading..."
                : captureIndex !== null
                  ? `Retake Photo ${captureIndex + 1}`
                  : `Take Photo ${photos.length + 1}`
            }
          />

          {error && <p className="form-error">{error}</p>}

          <PhotoPreview
            photos={photos}
            requiredCount={requiredCount}
            onRetake={handleRetake}
            onRemove={handleRemove}
          />

          <div className="page-actions">
            <button
              type="button"
              className="primary-button"
              onClick={handleComplete}
              disabled={
                photos.length !== requiredCount ||
                isCompleting ||
                isUploading
              }
            >
              {isCompleting
                ? "Generating Card..."
                : "Finish and Generate Card"}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

export default RecipientCameraPage;