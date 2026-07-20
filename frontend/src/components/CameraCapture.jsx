import { useCallback, useEffect, useRef, useState } from "react";

function CameraCapture({
  onCapture,
  disabled = false,
  buttonText = "Take Photo",
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [isStarting, setIsStarting] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Your browser does not support camera access.");
      return;
    }

    try {
      setIsStarting(true);
      setCameraError("");
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
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

      setCameraReady(true);
    } catch (error) {
      console.error("Camera error:", error);

      if (error.name === "NotAllowedError") {
        setCameraError(
          "Camera permission was denied. Allow camera access in your browser settings."
        );
      } else if (error.name === "NotFoundError") {
        setCameraError("No camera was found on this device.");
      } else if (error.name === "NotReadableError") {
        setCameraError(
          "The camera is already being used by another application."
        );
      } else {
        setCameraError("Unable to access the camera.");
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

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !cameraReady || disabled) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setCameraError("Camera is not ready yet.");
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Unable to process the captured image.");
      return;
    }

    if (facingMode === "user") {
      context.translate(width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Unable to capture the photo.");
          return;
        }

        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        const previewUrl = URL.createObjectURL(blob);

        onCapture?.({
          file,
          previewUrl,
        });
      },
      "image/jpeg",
      0.9
    );
  };

  const switchCamera = () => {
    setFacingMode((currentMode) =>
      currentMode === "user" ? "environment" : "user"
    );
  };

  return (
    <section className="camera-capture">
      <div className="camera-frame">
        <video
          ref={videoRef}
          className={`camera-video ${
            facingMode === "user" ? "camera-video-mirrored" : ""
          }`}
          autoPlay
          playsInline
          muted
        />

        {!cameraReady && !cameraError && (
          <div className="camera-overlay">
            <p>{isStarting ? "Starting camera..." : "Waiting for camera..."}</p>
          </div>
        )}

        {cameraError && (
          <div className="camera-overlay camera-error">
            <p>{cameraError}</p>

            <button
              type="button"
              className="secondary-button"
              onClick={startCamera}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="camera-canvas" />

      <div className="camera-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={switchCamera}
          disabled={disabled || isStarting}
        >
          Switch Camera
        </button>

        <button
          type="button"
          className="primary-button capture-button"
          onClick={handleCapture}
          disabled={!cameraReady || disabled}
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
}

export default CameraCapture;