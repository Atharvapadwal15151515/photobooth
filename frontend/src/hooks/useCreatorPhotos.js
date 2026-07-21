import { useCallback, useEffect, useState } from "react";
import { getBoothPhotos } from "../api/api";

const extractPhotos = (response) => {
  const value =
    response?.photos ??
    response?.data?.photos ??
    response?.data ??
    [];

  return Array.isArray(value) ? value : [];
};
const getRole = (photo) => {
  return (
    photo?.role ??
    photo?.participant_role ??
    photo?.participant?.role ??
    ""
  ).toLowerCase();
};

export function useCreatorPhotos(boothId) {
  const [creatorPhotos, setCreatorPhotos] = useState([]);
  const [isLoadingCreatorPhotos, setIsLoadingCreatorPhotos] =
    useState(true);
  const [creatorPhotosError, setCreatorPhotosError] = useState("");

  const loadCreatorPhotos = useCallback(async () => {
    if (!boothId) {
      setCreatorPhotosError("Booth ID is missing.");
      setIsLoadingCreatorPhotos(false);
      return;
    }

    try {
      setIsLoadingCreatorPhotos(true);
      setCreatorPhotosError("");

      const response = await getBoothPhotos(boothId);
      const photos = extractPhotos(response);

      const filteredPhotos = photos
        .filter((photo) => getRole(photo) === "creator")
        .sort(
          (first, second) =>
            Number(first.photo_number ?? first.photoNumber ?? 0) -
            Number(second.photo_number ?? second.photoNumber ?? 0)
        );

      setCreatorPhotos(filteredPhotos);
    } catch (error) {
      console.error("Unable to load creator photos:", error);

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
    reloadCreatorPhotos: loadCreatorPhotos,
  };
}