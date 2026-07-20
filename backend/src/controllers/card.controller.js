import asyncHandler from "../utils/asyncHandler.js";

import {
  generateBoothCard,
  getBoothGeneratedCard,
  regenerateBoothCard,
  removeGeneratedCard,
} from "../services/card.service.js";

/**
 * POST /api/cards/generate/:boothId
 * Generate the final 1080 × 1080 photo card.
 */
export const generateCard = asyncHandler(
  async (req, res) => {
    const card = await generateBoothCard(
      req.params.boothId
    );

    res.status(201).json({
      success: true,
      message: "Photo card generated successfully",
      data: card,
    });
  }
);

/**
 * GET /api/cards/booth/:boothId
 * Get the generated card for a booth.
 */
export const getCardByBooth = asyncHandler(
  async (req, res) => {
    const card = await getBoothGeneratedCard(
      req.params.boothId
    );

    res.status(200).json({
      success: true,
      data: card,
    });
  }
);

/**
 * PUT /api/cards/regenerate/:boothId
 * Generate the card again and replace the previous one.
 */
export const regenerateCard = asyncHandler(
  async (req, res) => {
    const card = await regenerateBoothCard(
      req.params.boothId
    );

    res.status(200).json({
      success: true,
      message: "Photo card regenerated successfully",
      data: card,
    });
  }
);

/**
 * DELETE /api/cards/booth/:boothId
 * Delete a generated card.
 */
export const deleteCard = asyncHandler(
  async (req, res) => {
    await removeGeneratedCard(
      req.params.boothId
    );

    res.status(200).json({
      success: true,
      message: "Generated card deleted successfully",
    });
  }
);