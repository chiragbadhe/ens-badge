import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import { getEnsName, getEnsAvatar } from "../utils/common";

type BaseParams = {
  address: `0x${string}`;
  data?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { address } = req.query as BaseParams;

    if (!address) {
      return res
        .status(400)
        .json({ error: "Valid Ethereum address is required" });
    }

    // Register custom font
    const fontPath = path.join(process.cwd(), "public", "satoshi.ttf");
    registerFont(fontPath, { family: "satoshi" });

    // Get ENS name and avatar
    const ensName = await getEnsName(address);
    const ensAvatar = await getEnsAvatar(address);

    // Dynamic canvas sizing based on content
    const avatarSize = 100; // Base avatar size
    const padding = 10; // Reduced padding around elements
    const fontSize = 48; // Font size for ENS name
    const outerPadding = 10; // Padding around entire image

    // Create temporary canvas to measure text
    const tempCanvas = createCanvas(1, 1);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.font = `500 ${fontSize}px satoshi`;
    
    // Calculate dimensions including outer padding
    const contentHeight = avatarSize + (padding * 2);
    const contentWidth = ensName ? 
      (avatarSize + padding * 3 + tempCtx.measureText(ensName).width) : 
      (avatarSize + padding * 2);
    
    const width = contentWidth + (outerPadding * 2);
    const height = contentHeight + (outerPadding * 2);
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // Draw rounded rectangle background with offset for outer padding
    ctx.beginPath();
    const radius = contentHeight / 2; // Fully rounded corners
    ctx.moveTo(outerPadding + radius, outerPadding);
    ctx.lineTo(outerPadding + contentWidth - radius, outerPadding);
    ctx.arcTo(outerPadding + contentWidth, outerPadding, outerPadding + contentWidth, outerPadding + radius, radius);
    ctx.arcTo(outerPadding + contentWidth, outerPadding + contentHeight, outerPadding + contentWidth - radius, outerPadding + contentHeight, radius);
    ctx.lineTo(outerPadding + radius, outerPadding + contentHeight);
    ctx.arcTo(outerPadding, outerPadding + contentHeight, outerPadding, outerPadding + radius, radius);
    ctx.arcTo(outerPadding, outerPadding, outerPadding + radius, outerPadding, radius);
    ctx.closePath();

    // Fill background
    ctx.fillStyle = "#5386ff";
    ctx.fill();

    // Reset shadow for border and content
    ctx.shadowColor = 'transparent';

    // Add border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 6;
    ctx.stroke();

    const centerY = height / 2;
    
    // Add ENS avatar if available - positioned on the left
    if (ensAvatar) {
      const avatar = await loadImage(ensAvatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(outerPadding + padding + avatarSize/2, centerY, avatarSize/2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        avatar,
        outerPadding + padding,
        centerY - avatarSize/2,
        avatarSize,
        avatarSize
      );
      ctx.restore();
    }

    // Add ENS name if available - positioned after avatar
    if (ensName) {
      ctx.fillStyle = "white";
      ctx.font = `500 ${fontSize}px satoshi`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(ensName, outerPadding + padding * 2 + avatarSize, centerY);
    }

    // Convert to PNG and send response
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
