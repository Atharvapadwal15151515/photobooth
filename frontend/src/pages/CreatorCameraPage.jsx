import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import CameraCapture from "../components/CameraCapture";
import PhotoPreview from "../components/PhotoPreview";

import {
  completeParticipant,
  deletePhoto,
  replacePhoto,
  uploadPhoto,
} from "../api/api";

function CreatorCameraPage() {
  const navigate = useNavigate();
  const { boothId, participantId } = useParams();

  const storedBooth = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("currentBooth") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const requiredCount = Math.max(
    1,
    Number(
      storedBooth.photoCount ??
        storedBooth.photo_count ??
        4
    ) || 4
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

  const getPhotoId = (photo) => {
    return (
      photo?.photo_id ??
      photo?.photoId ??
      photo?.id ??
      null
    );
  };

  const getServerPhoto = (response) => {
    return (
      response?.data?.data?.photo ??
      response?.data?.data ??
      response?.data?.photo ??
      response?.data ??
      response?.photo ??
      response ??
      {}
    );
  };

  const releasePreview = (previewUrl) => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleCapture = async (captureResult) => {
    /*
     * Supports both:
     *
     * onCapture(file)
     *
     * and:
     *
     * onCapture({
     *   file,
     *   previewUrl
     * })
     */

    const file =
      captureResult instanceof Blob
        ? captureResult
        : captureResult?.file;

    let previewUrl =
      captureResult instanceof Blob
        ? ""
        : captureResult?.previewUrl || "";

    console.log("Creator camera capture:", {
      captureResult,
      file,
      isFile:
        typeof File !== "undefined" &&
        file instanceof File,
      isBlob: file instanceof Blob,
      type: file?.type,
      size: file?.size,
      boothId,
      participantId,
    });

    if (!(file instanceof Blob)) {
      setError(
        "The camera did not return an image file."
      );
      return;
    }

    if (file.size === 0) {
      setError("The captured image file is empty.");
      return;
    }

    if (
      !file.type ||
      !file.type.startsWith("image/")
    ) {
      setError(
        "The captured file is not a valid image."
      );
      return;
    }

    if (!previewUrl) {
      previewUrl = URL.createObjectURL(file);
    }

    if (!boothId || !participantId) {
      releasePreview(previewUrl);

      setError(
        "The booth or creator participant ID is missing."
      );
      return;
    }

    if (isUploading || isCompleting) {
      releasePreview(previewUrl);
      return;
    }

    const photoNumber =
      captureIndex !== null
        ? captureIndex + 1
        : photos.length + 1;

    if (
      !Number.isInteger(photoNumber) ||
      photoNumber < 1 ||
      photoNumber > requiredCount
    ) {
      releasePreview(previewUrl);

      setError("The photo number is invalid.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const existingPhoto =
        captureIndex !== null
          ? photos[captureIndex]
          : null;

      const existingPhotoId =
        getPhotoId(existingPhoto);

      let response;

      if (existingPhotoId) {
        response = await replacePhoto({
          photoId: existingPhotoId,
          image: file,
        });
      } else {
        response = await uploadPhoto({
          image: file,
          boothId,
          participantId,
          photoNumber,
        });
      }

      const uploadedPhoto =
        getServerPhoto(response);

      const photoRecord = {
        ...uploadedPhoto,

        photo_id:
          getPhotoId(uploadedPhoto) ??
          existingPhotoId,

        photo_number:
          Number(
            uploadedPhoto?.photo_number ??
              uploadedPhoto?.photoNumber ??
              photoNumber
          ),

        previewUrl,
      };

      setPhotos((currentPhotos) => {
        if (captureIndex !== null) {
          const updatedPhotos = [
            ...currentPhotos,
          ];

          const oldPhoto =
            updatedPhotos[captureIndex];

          if (
            oldPhoto?.previewUrl &&
            oldPhoto.previewUrl !== previewUrl
          ) {
            releasePreview(
              oldPhoto.previewUrl
            );
          }

          updatedPhotos[captureIndex] =
            photoRecord;

          return updatedPhotos;
        }

        return [
          ...currentPhotos,
          photoRecord,
        ];
      });

      setCaptureIndex(null);
    } catch (requestError) {
      releasePreview(previewUrl);

      console.error(
        "Creator photo upload failed:",
        requestError
      );

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

    const selectedPhoto = photos[index];

    if (!selectedPhoto) {
      setError(
        "The selected photo could not be found."
      );
      return;
    }

    setCaptureIndex(index);
    setError("");
  };

  const handleRemove = async (index) => {
    if (isUploading || isCompleting) {
      return;
    }

    const selectedPhoto = photos[index];

    if (!selectedPhoto) {
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const photoId =
        getPhotoId(selectedPhoto);

      if (photoId) {
        await deletePhoto(photoId);
      }

      releasePreview(
        selectedPhoto.previewUrl
      );

      setPhotos((currentPhotos) =>
        currentPhotos.filter(
          (_, currentIndex) =>
            currentIndex !== index
        )
      );

      setCaptureIndex(null);
    } catch (requestError) {
      console.error(
        "Creator photo deletion failed:",
        requestError
      );

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
      setError(
        "Creator session information is missing."
      );
      return;
    }

    try {
      setIsCompleting(true);
      setError("");

      await completeParticipant(
        participantId
      );

      navigate(
        `/booth/${boothId}/waiting`
      );
    } catch (requestError) {
      console.error(
        "Creator completion failed:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ??
          requestError?.response?.data?.error ??
          requestError?.message ??
          "Unable to complete the session."
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

  const creatorName =
    storedBooth.creatorName ??
    storedBooth.creator_name ??
    "";

  return (
    <>
      <Navbar />

      <main className="page-container">
        <section className="camera-page">
          <div className="page-heading">
            <span>Creator photos</span>

            <h1>
              {creatorName
                ? `${creatorName}, take your photos`
                : "Take your photos"}
            </h1>

            <p>
              Take {requiredCount} photos.
              You can retake or remove them
              before finishing.
            </p>
          </div>

          {captureIndex !== null && (
            <div className="retake-notice">
              Retaking photo{" "}
              {captureIndex + 1}
            </div>
          )}

          <CameraCapture
            onCapture={handleCapture}
            disabled={cameraDisabled}
            buttonText={
              isUploading
                ? "Uploading..."
                : captureIndex !== null
                  ? `Retake Photo ${
                      captureIndex + 1
                    }`
                  : photos.length <
                      requiredCount
                    ? `Take Photo ${
                        photos.length + 1
                      }`
                    : "All Photos Taken"
            }
          />

          {error && (
            <p
              className="form-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <PhotoPreview
            photos={photos}
            requiredCount={
              requiredCount
            }
            onRetake={handleRetake}
            onRemove={handleRemove}
          />

          <div className="page-actions">
            <button
              type="button"
              className="primary-button"
              onClick={handleComplete}
              disabled={
                photos.length !==
                  requiredCount ||
                isUploading ||
                isCompleting
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