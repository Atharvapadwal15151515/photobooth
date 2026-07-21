import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import CameraCapture from "../components/CameraCapture";
import PhotoPreview from "../components/PhotoPreview";

import {
  completeParticipant,
  deletePhoto,
  uploadPhoto,
} from "../api/api";

function CreatorCameraPage() {
  const navigate = useNavigate();
  const { boothId, participantId } = useParams();

  const storedBooth = JSON.parse(
    localStorage.getItem("currentBooth") || "{}"
  );

  const requiredCount = Number(
    storedBooth.photoCount ||
      storedBooth.photo_count ||
      4
  );

  const [photos, setPhotos] = useState([]);
  const [captureIndex, setCaptureIndex] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const photosRef = useRef([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => {
        if (photo?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
    };
  }, []);

  const extractUploadedPhoto = (response) => {
    const responseBody = response?.data ?? response ?? {};

    return (
      responseBody?.data?.photo ??
      responseBody?.data ??
      responseBody?.photo ??
      responseBody
    );
  };

  const getPhotoId = (photo) => {
    return (
      photo?.photo_id ??
      photo?.photoId ??
      photo?.id ??
      null
    );
  };

  const handleCapture = async (captureResult) => {
    const file = captureResult?.file ?? null;
    const previewUrl = captureResult?.previewUrl ?? null;

    console.log("Creator capture received:", {
      file,
      previewUrl,
      isBlob: file instanceof Blob,
      size: file?.size,
    });

    if (!(file instanceof Blob) || file.size === 0) {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setError(
        "The camera did not produce a valid image file."
      );

      return;
    }

    if (!previewUrl) {
      setError("The photo preview could not be created.");
      return;
    }

    if (!boothId || !participantId) {
      URL.revokeObjectURL(previewUrl);

      setError(
        "The booth or creator participant information is missing."
      );

      return;
    }

    if (isUploading) {
      URL.revokeObjectURL(previewUrl);
      return;
    }

    const photoNumber =
      captureIndex !== null
        ? captureIndex + 1
        : photos.length + 1;

    if (photoNumber > requiredCount) {
      URL.revokeObjectURL(previewUrl);
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const existingPhoto =
        captureIndex !== null
          ? photos[captureIndex]
          : null;

      const existingPhotoId = getPhotoId(existingPhoto);

      if (existingPhotoId) {
        await deletePhoto(existingPhotoId);
      }

      const response = await uploadPhoto({
        image: file,
        boothId,
        participantId,
        photoNumber,
      });

      const uploadedPhoto = extractUploadedPhoto(response);

      const photoRecord = {
        ...uploadedPhoto,

        photo_id:
          uploadedPhoto?.photo_id ??
          uploadedPhoto?.photoId ??
          uploadedPhoto?.id ??
          null,

        photo_number:
          uploadedPhoto?.photo_number ??
          uploadedPhoto?.photoNumber ??
          photoNumber,

        previewUrl,
        file,
      };

      setPhotos((currentPhotos) => {
        if (captureIndex !== null) {
          const updatedPhotos = [...currentPhotos];
          const oldPhoto = updatedPhotos[captureIndex];

          if (
            oldPhoto?.previewUrl?.startsWith("blob:") &&
            oldPhoto.previewUrl !== previewUrl
          ) {
            URL.revokeObjectURL(oldPhoto.previewUrl);
          }

          updatedPhotos[captureIndex] = photoRecord;

          return updatedPhotos;
        }

        return [...currentPhotos, photoRecord];
      });

      setCaptureIndex(null);
    } catch (requestError) {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      console.error("Creator photo upload error:", requestError);

      setError(
        requestError?.response?.data?.message ??
          requestError?.response?.data?.error ??
          requestError?.message ??
          "Unable to upload the photo."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = (index) => {
    if (isUploading || isCompleting) {
      return;
    }

    setCaptureIndex(index);
    setError("");
  };

  const handleRemove = async (index) => {
    const photo = photos[index];

    if (!photo || isUploading || isCompleting) {
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const photoId = getPhotoId(photo);

      if (photoId) {
        await deletePhoto(photoId);
      }

      if (photo.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(photo.previewUrl);
      }

      setPhotos((currentPhotos) =>
        currentPhotos
          .filter((_, photoIndex) => photoIndex !== index)
          .map((currentPhoto, newIndex) => ({
            ...currentPhoto,
            photo_number: newIndex + 1,
          }))
      );

      setCaptureIndex(null);
    } catch (requestError) {
      console.error("Creator photo removal error:", requestError);

      setError(
        requestError?.response?.data?.message ??
          requestError?.response?.data?.error ??
          requestError?.message ??
          "Unable to remove the photo."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleComplete = async () => {
    if (photos.length !== requiredCount) {
      setError(
        `Take all ${requiredCount} photos before continuing.`
      );

      return;
    }

    if (!participantId || !boothId) {
      setError("Creator session information is missing.");
      return;
    }

    try {
      setIsCompleting(true);
      setError("");

      await completeParticipant(participantId);

      navigate(`/booth/${boothId}/waiting`);
    } catch (requestError) {
      console.error(
        "Complete creator participant error:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ??
          requestError?.response?.data?.error ??
          requestError?.message ??
          "Unable to complete your session."
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const cameraDisabled =
    isUploading ||
    isCompleting ||
    (photos.length >= requiredCount &&
      captureIndex === null);

  return (
    <>
      <Navbar />

      <main className="page-container">
        <section className="camera-page">
          <div className="page-heading">
            <span>Creator photos</span>

            <h1>
              {storedBooth.creatorName
                ? `${storedBooth.creatorName}, take your photos`
                : "Take your photos"}
            </h1>

            <p>
              Look into the camera and take {requiredCount} photos.
              You can retake any photo before finishing.
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

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

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
                ? "Finishing..."
                : "Finish and Create Invite"}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

export default CreatorCameraPage;