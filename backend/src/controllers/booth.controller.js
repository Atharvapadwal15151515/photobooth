import asyncHandler from "../utils/asyncHandler.js";

import {
  createNewBooth,
  getBoothDetails,
  getBoothUsingInviteToken,
  updateExistingBooth,
  removeBooth,
} from "../services/booth.service.js";

/**
 * POST /api/booths
 * Create a new photo booth.
 */
export const createBooth = asyncHandler(
  async (req, res) => {
    const booth = await createNewBooth({
      creatorUserId: req.body.creatorUserId || null,
      creatorName: req.body.creatorName,
      recipientName: req.body.recipientName,
      title: req.body.title || null,
      message: req.body.message || null,
      theme: req.body.theme || "classic",
      photoCount: req.body.photoCount || 4,
      expiresAt: req.body.expiresAt || null,
    });

    res.status(201).json({
      success: true,
      message: "Photo booth created successfully",
      data: booth,
    });
  }
);

/**
 * GET /api/booths/:boothId
 * Get booth details using the booth ID.
 */
export const getBoothById = asyncHandler(
  async (req, res) => {
    const booth = await getBoothDetails(
      req.params.boothId
    );

    res.status(200).json({
      success: true,
      data: booth,
    });
  }
);

/**
 * GET /api/booths/invite/:inviteToken
 * Open a booth using its invitation token.
 */
export const getBoothByInviteToken = asyncHandler(
  async (req, res) => {
    const booth = await getBoothUsingInviteToken(
      req.params.inviteToken
    );

    res.status(200).json({
      success: true,
      data: booth,
    });
  }
);

/**
 * PATCH /api/booths/:boothId
 * Update booth information.
 */
export const updateBooth = asyncHandler(
  async (req, res) => {
    const booth = await updateExistingBooth(
      req.params.boothId,
      {
        creatorName: req.body.creatorName,
        recipientName: req.body.recipientName,
        title: req.body.title,
        message: req.body.message,
        theme: req.body.theme,
        photoCount: req.body.photoCount,
        expiresAt: req.body.expiresAt,
      }
    );

    res.status(200).json({
      success: true,
      message: "Photo booth updated successfully",
      data: booth,
    });
  }
);

/**
 * DELETE /api/booths/:boothId
 * Delete a booth.
 */
export const deleteBooth = asyncHandler(
  async (req, res) => {
    await removeBooth(req.params.boothId);

    res.status(200).json({
      success: true,
      message: "Photo booth deleted successfully",
    });
  }
);