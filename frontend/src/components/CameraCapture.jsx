import { useEffect, useRef, useState } from "react";

function CameraCapture({
  onCapture,
  disabled = false,
  buttonText = "Take Photo",
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState("user");
  const [cameraError, setCameraError] = useState("");
  const [isStartingCamera, setIsStartingCamera] =
    useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    try {
      setIsStartingCamera(true);
      setCameraError("");

      stopCamera();

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: facingMode,
            },
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Camera start error:", error);

      if (error?.name === "NotAllowedError") {
        setCameraError(
          "Camera permission was denied. Allow camera access and reload the page."
        );
      } else if (error?.name === "NotFoundError") {
        setCameraError(
          "No camera was found on this device."
        );
      } else if (error?.name === "NotReadableError") {
        setCameraError(
          "The camera is already being used by another application."
        );
      } else {
        setCameraError(
          error?.message || "Unable to start the camera."
        );
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const createImageBlob = (canvas) => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "The captured image could not be created."
              )
            );
            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleTakePhoto = async () => {
    if (disabled || isCapturing) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setCameraError("The camera is not ready.");
      return;
    }

    if (
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      setCameraError(
        "The camera is still loading. Try again in a moment."
      );
      return;
    }

    try {
      setIsCapturing(true);
      setCameraError("");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error(
          "Unable to prepare the captured image."
        );
      }

      /*
       * Mirror front-camera photos so the saved image matches
       * what the user sees in the preview.
       */
      if (facingMode === "user") {
        context.save();
        context.translate(canvas.width, 0);
        context.scale(-1, 1);

        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.restore();
      } else {
        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      const blob = await createImageBlob(canvas);

      const file = new File(
        [blob],
        `photo-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        }
      );

      const previewUrl = URL.createObjectURL(file);

      console.log("CAPTURED FILE:", file);
      console.log("CAPTURED FILE SIZE:", file.size);

      await onCapture({
        file,
        previewUrl,
      });
    } catch (error) {
      console.error("Photo capture error:", error);

      setCameraError(
        error?.message || "Unable to capture the photo."
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSwitchCamera = () => {
    if (disabled || isCapturing) {
      return;
    }

    setFacingMode((currentMode) =>
      currentMode === "user" ? "environment" : "user"
    );
  };

  return (
    <section className="camera-capture">
      <div className="camera-frame">
        {isStartingCamera && (
          <div className="camera-status">
            Starting camera...
          </div>
        )}

        <video
          ref={videoRef}
          className={
            facingMode === "user"
              ? "camera-video camera-video-mirrored"
              : "camera-video"
          }
          autoPlay
          muted
          playsInline
        />

        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
        />
      </div>

      {cameraError && (
        <p className="form-error" role="alert">
          {cameraError}
        </p>
      )}

      <div className="camera-actions">
        <button
          type="button"
          className="primary-button camera-capture-button"
          onClick={handleTakePhoto}
          disabled={
            disabled ||
            isStartingCamera ||
            isCapturing ||
            Boolean(cameraError)
          }
        >
          {isCapturing ? "Capturing..." : buttonText}
        </button>

        <button
          type="button"
          className="secondary-button camera-switch-button"
          onClick={handleSwitchCamera}
          disabled={
            disabled ||
            isStartingCamera ||
            isCapturing
          }
        >
          Switch Camera
        </button>
      </div>
    </section>
  );
}

export default CameraCapture;