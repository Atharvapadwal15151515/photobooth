import axios from "axios";

/*
|--------------------------------------------------------------------------
| Axios instance
|--------------------------------------------------------------------------
*/

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",

  timeout: 60000,
});

/*
|--------------------------------------------------------------------------
| Request interceptor
|--------------------------------------------------------------------------
|
| Never send application/json for FormData.
| Axios/browser must generate:
|
| multipart/form-data; boundary=...
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      if (
        typeof config.headers?.delete ===
        "function"
      ) {
        config.headers.delete(
          "Content-Type"
        );

        config.headers.delete(
          "content-type"
        );
      } else if (config.headers) {
        delete config.headers[
          "Content-Type"
        ];

        delete config.headers[
          "content-type"
        ];
      }
    }

    return config;
  },

  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| Response helper
|--------------------------------------------------------------------------
*/

const extractData = (response) => {
  return (
    response?.data?.data ??
    response?.data ??
    response
  );
};

/*
|--------------------------------------------------------------------------
| Image helpers
|--------------------------------------------------------------------------
*/

const createImageFile = (
  image,
  prefix = "photo"
) => {
  if (!(image instanceof Blob)) {
    throw new Error(
      "A valid image file is required."
    );
  }

  if (image.size === 0) {
    throw new Error(
      "The image file is empty."
    );
  }

  if (
    !image.type ||
    !image.type.startsWith("image/")
  ) {
    throw new Error(
      "The selected file is not an image."
    );
  }

  if (image instanceof File) {
    return image;
  }

  const extension =
    image.type === "image/png"
      ? "png"
      : image.type === "image/webp"
        ? "webp"
        : "jpg";

  return new File(
    [image],
    `${prefix}-${Date.now()}.${extension}`,
    {
      type: image.type || "image/jpeg",
      lastModified: Date.now(),
    }
  );
};

const logFormData = (formData) => {
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(
        `FormData ${key}:`,
        {
          name: value.name,
          type: value.type,
          size: value.size,
        }
      );
    } else {
      console.log(
        `FormData ${key}:`,
        value
      );
    }
  }
};

/*
|--------------------------------------------------------------------------
| Booth API
|--------------------------------------------------------------------------
*/

export const createBooth = async (
  boothData
) => {
  if (!boothData) {
    throw new Error(
      "Booth information is required."
    );
  }

  const response = await api.post(
    "/booths",
    boothData
  );

  return extractData(response);
};

export const getBoothById = async (
  boothId
) => {
  if (!boothId) {
    throw new Error(
      "Booth ID is required."
    );
  }

  const response = await api.get(
    `/booths/${boothId}`
  );

  return extractData(response);
};

export const getBoothByInviteToken =
  async (inviteToken) => {
    if (!inviteToken) {
      throw new Error(
        "Invite token is required."
      );
    }

    const response = await api.get(
      `/booths/invite/${inviteToken}`
    );

    return extractData(response);
  };

export const updateBooth = async (
  boothId,
  boothData
) => {
  if (!boothId) {
    throw new Error(
      "Booth ID is required."
    );
  }

  if (!boothData) {
    throw new Error(
      "Booth information is required."
    );
  }

  const response = await api.patch(
    `/booths/${boothId}`,
    boothData
  );

  return extractData(response);
};

export const deleteBooth = async (
  boothId
) => {
  if (!boothId) {
    throw new Error(
      "Booth ID is required."
    );
  }

  const response = await api.delete(
    `/booths/${boothId}`
  );

  return extractData(response);
};

/*
|--------------------------------------------------------------------------
| Participant API
|--------------------------------------------------------------------------
*/

export const createParticipant =
  async (participantData) => {
    if (!participantData) {
      throw new Error(
        "Participant information is required."
      );
    }

    const response = await api.post(
      "/participants",
      participantData
    );

    return extractData(response);
  };

export const getParticipantById =
  async (participantId) => {
    if (!participantId) {
      throw new Error(
        "Participant ID is required."
      );
    }

    const response = await api.get(
      `/participants/${participantId}`
    );

    return extractData(response);
  };

export const getParticipantsByBooth =
  async (boothId) => {
    if (!boothId) {
      throw new Error(
        "Booth ID is required."
      );
    }

    const response = await api.get(
      `/participants/booth/${boothId}`
    );

    return extractData(response);
  };

export const completeParticipant =
  async (participantId) => {
    if (!participantId) {
      throw new Error(
        "Participant ID is required."
      );
    }

    const response = await api.patch(
      `/participants/${participantId}/complete`
    );

    return extractData(response);
  };

export const updateParticipantName =
  async (
    participantId,
    displayName
  ) => {
    if (!participantId) {
      throw new Error(
        "Participant ID is required."
      );
    }

    if (!displayName?.trim()) {
      throw new Error(
        "Display name is required."
      );
    }

    const response = await api.patch(
      `/participants/${participantId}/name`,
      {
        displayName:
          displayName.trim(),
      }
    );

    return extractData(response);
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
  if (!boothId) {
    throw new Error(
      "Booth ID is required."
    );
  }

  if (!participantId) {
    throw new Error(
      "Participant ID is required."
    );
  }

  const parsedPhotoNumber =
    Number(photoNumber);

  if (
    !Number.isInteger(
      parsedPhotoNumber
    ) ||
    parsedPhotoNumber < 1
  ) {
    throw new Error(
      "A valid photo number is required."
    );
  }

  const imageFile =
    createImageFile(
      image,
      `photo-${parsedPhotoNumber}`
    );

  const formData = new FormData();

  /*
   * This field name must match:
   *
   * upload.single("image")
   */
  formData.append(
    "image",
    imageFile,
    imageFile.name
  );

  formData.append(
    "boothId",
    String(boothId)
  );

  formData.append(
    "participantId",
    String(participantId)
  );

  formData.append(
    "photoNumber",
    String(parsedPhotoNumber)
  );

  console.log(
    "Preparing photo upload:",
    {
      boothId,
      participantId,
      photoNumber:
        parsedPhotoNumber,
      filename:
        imageFile.name,
      type: imageFile.type,
      size: imageFile.size,
    }
  );

  logFormData(formData);

  const response = await api.post(
    "/photos",
    formData,
    {
      timeout: 90000,
    }
  );

  return extractData(response);
};

export const replacePhoto = async ({
  photoId,
  image,
}) => {
  if (!photoId) {
    throw new Error(
      "Photo ID is required."
    );
  }

  const imageFile =
    createImageFile(
      image,
      `replacement-${photoId}`
    );

  const formData = new FormData();

  formData.append(
    "image",
    imageFile,
    imageFile.name
  );

  console.log(
    "Preparing replacement upload:",
    {
      photoId,
      filename:
        imageFile.name,
      type: imageFile.type,
      size: imageFile.size,
    }
  );

  logFormData(formData);

  const response = await api.put(
    `/photos/${photoId}`,
    formData,
    {
      timeout: 90000,
    }
  );

  return extractData(response);
};

export const getParticipantPhotos =
  async (participantId) => {
    if (!participantId) {
      throw new Error(
        "Participant ID is required."
      );
    }

    const response = await api.get(
      `/photos/participant/${participantId}`
    );

    return extractData(response);
  };

export const getBoothPhotos = async (
  boothId
) => {
  if (!boothId) {
    throw new Error(
      "Booth ID is required."
    );
  }

  const response = await api.get(
    `/photos/booth/${boothId}`
  );

  return extractData(response);
};

export const deletePhoto = async (
  photoId
) => {
  if (!photoId) {
    throw new Error(
      "Photo ID is required."
    );
  }

  const response = await api.delete(
    `/photos/${photoId}`
  );

  return extractData(response);
};

/*
|--------------------------------------------------------------------------
| Generated card API
|--------------------------------------------------------------------------
*/

export const generateCard = async (
  boothId
) => {
  if (!boothId) {
    throw new Error(
      "Booth ID is required."
    );
  }

  const response = await api.post(
    `/cards/generate/${boothId}`,
    {},
    {
      timeout: 120000,
    }
  );

  return extractData(response);
};

export const getGeneratedCard =
  async (boothId) => {
    if (!boothId) {
      throw new Error(
        "Booth ID is required."
      );
    }

    const response = await api.get(
      `/cards/booth/${boothId}`
    );

    return extractData(response);
  };

export const regenerateCard =
  async (boothId) => {
    if (!boothId) {
      throw new Error(
        "Booth ID is required."
      );
    }

    const response = await api.put(
      `/cards/regenerate/${boothId}`,
      {},
      {
        timeout: 120000,
      }
    );

    return extractData(response);
  };

export const deleteGeneratedCard =
  async (boothId) => {
    if (!boothId) {
      throw new Error(
        "Booth ID is required."
      );
    }

    const response = await api.delete(
      `/cards/booth/${boothId}`
    );

    return extractData(response);
  };

/*
|--------------------------------------------------------------------------
| Axios error interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error?.response?.status;

    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error;

    if (serverMessage) {
      error.message =
        serverMessage;
    } else if (
      error.code ===
      "ECONNABORTED"
    ) {
      error.message =
        "The server took too long to respond.";
    } else if (
      !error.response
    ) {
      error.message =
        "Unable to connect to the server.";
    } else if (status === 400) {
      error.message =
        "The submitted information is invalid.";
    } else if (status === 404) {
      error.message =
        "The requested resource was not found.";
    } else if (status === 409) {
      error.message =
        "This photo position has already been used.";
    } else if (status === 413) {
      error.message =
        "The selected image is too large.";
    } else if (status >= 500) {
      error.message =
        "The server could not process the request.";
    }

    console.error(
      "API request failed:",
      {
        url: error?.config?.url,
        method:
          error?.config?.method,
        requestContentType:
          error?.config?.headers?.[
            "Content-Type"
          ],
        status,
        message:
          error.message,
        response:
          error?.response?.data,
      }
    );

    return Promise.reject(error);
  }
);

export default api;