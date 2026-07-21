import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 60000,
});

/*
|--------------------------------------------------------------------------
| Booth API
|--------------------------------------------------------------------------
*/

export const createBooth = async (boothData) => {
  return api.post("/booths", boothData);
};

export const getBoothById = async (boothId) => {
  if (!boothId) {
    throw new Error("Booth ID is required.");
  }

  return api.get(`/booths/${boothId}`);
};

export const getBoothByInviteToken = async (inviteToken) => {
  if (!inviteToken) {
    throw new Error("Invite token is required.");
  }

  return api.get(`/booths/invite/${inviteToken}`);
};

/*
|--------------------------------------------------------------------------
| Photo API
|--------------------------------------------------------------------------
*/

export const uploadPhoto = async ({
  image,
  boothId,
  participantId,
  photoNumber,
}) => {
  if (!image) {
    throw new Error("Photo file is required.");
  }

  if (!boothId) {
    throw new Error("Booth ID is required.");
  }

  if (!participantId) {
    throw new Error("Participant ID is required.");
  }

  const formData = new FormData();

  formData.append("image", image);
  formData.append("boothId", boothId);
  formData.append("participantId", participantId);
  formData.append("photoNumber", String(photoNumber));

  return api.post("/photos", formData, {
    timeout: 60000,
  });
};

export const getParticipantPhotos = async (
  boothId,
  participantId
) => {
  if (!boothId || !participantId) {
    throw new Error(
      "Booth ID and participant ID are required."
    );
  }

  return api.get(
    `/photos/booth/${boothId}/participant/${participantId}`
  );
};

export const deletePhoto = async (photoId) => {
  if (!photoId) {
    throw new Error("Photo ID is required.");
  }

  return api.delete(`/photos/${photoId}`);
};

/*
|--------------------------------------------------------------------------
| Participant API
|--------------------------------------------------------------------------
*/

export const completeParticipant = async (
  participantId
) => {
  if (!participantId) {
    throw new Error("Participant ID is required.");
  }

  return api.patch(
    `/participants/${participantId}/complete`
  );
};

/*
|--------------------------------------------------------------------------
| Generated card API
|--------------------------------------------------------------------------
*/

export const generateCard = async (boothId) => {
  if (!boothId) {
    throw new Error("Booth ID is required.");
  }

  return api.post(
    `/cards/generate/${boothId}`,
    {},
    {
      timeout: 90000,
    }
  );
};

export const getGeneratedCard = async (boothId) => {
  if (!boothId) {
    throw new Error("Booth ID is required.");
  }

  return api.get(`/cards/${boothId}`);
};

/*
|--------------------------------------------------------------------------
| Axios error interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error;

    if (serverMessage) {
      error.message = serverMessage;
    } else if (status === 404) {
      error.message = "The requested resource was not found.";
    } else if (status === 413) {
      error.message = "The selected image is too large.";
    } else if (error.code === "ECONNABORTED") {
      error.message =
        "The server took too long to respond.";
    } else if (!error.response) {
      error.message =
        "Unable to connect to the server. Make sure the backend is running.";
    }

    return Promise.reject(error);
  }
);

export default api;