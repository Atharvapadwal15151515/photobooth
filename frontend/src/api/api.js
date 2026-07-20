import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 20000,
});

/*
|--------------------------------------------------------------------------
| Booth API
|--------------------------------------------------------------------------
*/

export const createBooth = async (boothData) => {
  const response = await api.post("/booths", boothData);
  return response;
};

export const getBoothById = async (boothId) => {
  if (!boothId) {
    throw new Error("Booth ID is required.");
  }

  const response = await api.get(`/booths/${boothId}`);
  return response;
};

export const getBoothByInviteToken = async (inviteToken) => {
  if (!inviteToken) {
    throw new Error("Invite token is required.");
  }

  const response = await api.get(
    `/booths/invite/${inviteToken}`
  );

  return response;
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

  const response = await api.post("/photos", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response;
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

  const response = await api.get(
    `/photos/booth/${boothId}/participant/${participantId}`
  );

  return response;
};

export const deletePhoto = async (photoId) => {
  if (!photoId) {
    throw new Error("Photo ID is required.");
  }

  const response = await api.delete(`/photos/${photoId}`);

  return response;
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

  const response = await api.patch(
    `/participants/${participantId}/complete`
  );

  return response;
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

  const response = await api.post(
    `/cards/generate/${boothId}`
  );

  return response;
};

export const getGeneratedCard = async (boothId) => {
  if (!boothId) {
    throw new Error("Booth ID is required.");
  }

  const response = await api.get(`/cards/${boothId}`);

  return response;
};

/*
|--------------------------------------------------------------------------
| Axios error interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error;

    if (serverMessage) {
      error.message = serverMessage;
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