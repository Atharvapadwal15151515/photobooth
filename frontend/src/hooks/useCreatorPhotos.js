import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getBoothPhotos } from "../api/api";

const extractPhotos = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.photos)) {
    return response.photos;
  }

  if (Array.isArray(response?.data?.photos)) {
    return response.data.photos;
  }

  return [];
};

const getRole = (photo) => {
  return String(
    photo?.role ??
      photo?.participant_role ??
      photo?.participant?.role ??
      ""
  ).toLowerCase();
};

export function useCreatorPhotos(boothId) {
  const [creatorPhotos, setCreatorPhotos] =
    useState([]);

  const [
    isLoadingCreatorPhotos,
    setIsLoadingCreatorPhotos,
  ] = useState(true);

  const [
    creatorPhotosError,
    setCreatorPhotosError,
  ] = useState("");

  const loadCreatorPhotos = useCallback(async () => {
    if (!boothId) {
      setCreatorPhotos([]);
      setCreatorPhotosError(
        "Booth ID is missing."
      );
      setIsLoadingCreatorPhotos(false);
      return;
    }

    try {
      setIsLoadingCreatorPhotos(true);
      setCreatorPhotosError("");

      const response =
        await getBoothPhotos(boothId);

      console.log(
        "Booth photos API response:",
        response
      );

      const photos = extractPhotos(response);

      console.log(
        "Extracted booth photos:",
        photos
      );

      const filteredPhotos = photos
        .filter(
          (photo) =>
            getRole(photo) === "creator"
        )
        .sort(
          (first, second) =>
            Number(
              first?.photo_number ??
                first?.photoNumber ??
                0
            ) -
            Number(
              second?.photo_number ??
                second?.photoNumber ??
                0
            )
        );

      console.log(
        "Filtered creator photos:",
        filteredPhotos
      );

      setCreatorPhotos(filteredPhotos);
    } catch (error) {
      console.error(
        "Unable to load creator photos:",
        error
      );

      setCreatorPhotos([]);

      setCreatorPhotosError(
        error?.response?.data?.message ??
          error?.message ??
          "Unable to load the creator's photos."
      );
    } finally {
      setIsLoadingCreatorPhotos(false);
    }
  }, [boothId]);

  useEffect(() => {
    loadCreatorPhotos();
  }, [loadCreatorPhotos]);

  return {
    creatorPhotos,
    isLoadingCreatorPhotos,
    creatorPhotosError,
    reloadCreatorPhotos:
      loadCreatorPhotos,
  };
}