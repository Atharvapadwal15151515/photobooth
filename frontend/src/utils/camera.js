export const CAMERA_FACING_MODES = {
  FRONT: "user",
  BACK: "environment",
};

export const CAMERA_ERRORS = {
  NotAllowedError:
    "Camera permission was denied. Allow camera access in your browser settings.",
  NotFoundError: "No camera was found on this device.",
  NotReadableError:
    "The camera is already being used by another application.",
  OverconstrainedError:
    "The selected camera settings are not supported by this device.",
  SecurityError:
    "Camera access requires HTTPS or localhost.",
};

export const getCameraErrorMessage = (error) => {
  if (!error) {
    return "Unable to access the camera.";
  }

  return (
    CAMERA_ERRORS[error.name] ||
    error.message ||
    "Unable to access the camera."
  );
};

export const stopMediaStream = (stream) => {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => {
    track.stop();
  });
};

export const requestCameraStream = async ({
  facingMode = CAMERA_FACING_MODES.FRONT,
  width = 1280,
  height = 720,
} = {}) => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera access is not supported by this browser.");
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: {
        ideal: facingMode,
      },
      width: {
        ideal: width,
      },
      height: {
        ideal: height,
      },
    },
    audio: false,
  });
};

export const captureVideoFrame = ({
  videoElement,
  canvasElement,
  facingMode = CAMERA_FACING_MODES.FRONT,
  quality = 0.9,
}) => {
  return new Promise((resolve, reject) => {
    if (!videoElement || !canvasElement) {
      reject(new Error("Camera elements are missing."));
      return;
    }

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;

    if (!width || !height) {
      reject(new Error("The camera is not ready yet."));
      return;
    }

    canvasElement.width = width;
    canvasElement.height = height;

    const context = canvasElement.getContext("2d");

    if (!context) {
      reject(new Error("Unable to process the captured photo."));
      return;
    }

    context.save();

    if (facingMode === CAMERA_FACING_MODES.FRONT) {
      context.translate(width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(videoElement, 0, 0, width, height);
    context.restore();

    canvasElement.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to capture the photo."));
          return;
        }

        const file = new File(
          [blob],
          `photo-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        const previewUrl = URL.createObjectURL(blob);

        resolve({
          file,
          blob,
          previewUrl,
          width,
          height,
        });
      },
      "image/jpeg",
      quality
    );
  });
};

export const revokePreviewUrl = (previewUrl) => {
  if (previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }
};

export const isCameraSupported = () => {
  return Boolean(navigator.mediaDevices?.getUserMedia);
};