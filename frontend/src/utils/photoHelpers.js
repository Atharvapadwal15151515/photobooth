export const getPhotoUrl = (photo) => {
  return (
    photo?.image_url ??
    photo?.imageUrl ??
    photo?.photo_url ??
    photo?.photoUrl ??
    photo?.secure_url ??
    photo?.url ??
    null
  );
};

export const getPhotoNumber = (photo) => {
  return Number(photo?.photo_number ?? photo?.photoNumber ?? 0);
};