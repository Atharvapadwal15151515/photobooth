import { useCallback, useEffect, useRef, useState } from "react";

function CameraCapture({
  onCapture,
  disabled = false,
  buttonText = "Take Photo",
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState("user");
  const [isStarting, setIsStarting] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsStarting(true);
      setCameraError("");

      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: facingMode,
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 1280,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        throw new Error("Camera preview could not be initialized.");
      }

      video.srcObject = stream;

      await video.play();
    } catch (error) {
      console.error("Camera initialization error:", error);

      if (error?.name === "NotAllowedError") {
        setCameraError(
          "Camera permission was denied. Allow camera access and reload the page."
        );
      } else if (error?.name === "NotFoundError") {
        setCameraError("No camera was found on this device.");
      } else if (error?.name === "NotReadableError") {
        setCameraError(
          "The camera is being used by another application."
        );
      } else if (error?.name === "OverconstrainedError") {
        setCameraError(
          "The selected camera is not available on this device."
        );
      } else {
        setCameraError(
          error?.message || "Unable to start the camera."
        );
      }
    } finally {
      setIsStarting(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const canvasToBlob = (canvas) => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size === 0) {
            reject(
              new Error("The captured image could not be created.")
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
    if (disabled || isCapturing || isStarting) {
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
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setCameraError(
        "The camera is still loading. Wait briefly and try again."
      );

      return;
    }

    let previewUrl = null;

    try {
      setIsCapturing(true);
      setCameraError("");

      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;

      /*
       * Capture a square image from the centre of the video.
       */
      const squareSize = Math.min(sourceWidth, sourceHeight);
      const sourceX = (sourceWidth - squareSize) / 2;
      const sourceY = (sourceHeight - squareSize) / 2;

      canvas.width = squareSize;
      canvas.height = squareSize;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to prepare the captured image.");
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      /*
       * The front-camera saved image is mirrored to match
       * the preview shown to the user.
       */
      if (facingMode === "user") {
        context.save();
        context.translate(canvas.width, 0);
        context.scale(-1, 1);

        context.drawImage(
          video,
          sourceX,
          sourceY,
          squareSize,
          squareSize,
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.restore();
      } else {
        context.drawImage(
          video,
          sourceX,
          sourceY,
          squareSize,
          squareSize,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      const blob = await canvasToBlob(canvas);

      const file = new File(
        [blob],
        `photo-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        }
      );

      if (!(file instanceof Blob) || file.size === 0) {
        throw new Error(
          "The camera did not produce a valid image file."
        );
      }

      previewUrl = URL.createObjectURL(file);

      console.log("Camera captured file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      await onCapture({
        file,
        previewUrl,
      });
    } catch (error) {
      console.error("Photo capture error:", error);

      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setCameraError(
        error?.message || "Unable to capture the photo."
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSwitchCamera = () => {
    if (disabled || isCapturing || isStarting) {
      return;
    }

    setFacingMode((currentMode) =>
      currentMode === "user" ? "environment" : "user"
    );
  };

  return (
    <section className="camera-capture">
      <div className="camera-frame">
        {isStarting && (
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
          aria-hidden="true"
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
            isStarting ||
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
          disabled={disabled || isStarting || isCapturing}
        >
          Switch Camera
        </button>
      </div>
    </section>
  );
}

export default CameraCapture;