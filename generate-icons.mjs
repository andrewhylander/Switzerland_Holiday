// Run with: node generate-icons.mjs
// Generates icon-192.png and icon-512.png for the PWA manifest

import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const r = size * 0.12; // corner radius

  // Red background with rounded corners
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = "#c0152a";
  ctx.fill();

  // White Swiss cross
  const cx = size / 2;
  const cy = size / 2;
  const armW = size * 0.2;
  const armH = size * 0.48;
  ctx.fillStyle = "white";
  // Vertical bar
  ctx.fillRect(cx - armW / 2, cy - armH / 2, armW, armH);
  // Horizontal bar
  ctx.fillRect(cx - armH / 2, cy - armW / 2, armH, armW);

  return canvas.toBuffer("image/png");
}

writeFileSync("public/icon-192.png", drawIcon(192));
writeFileSync("public/icon-512.png", drawIcon(512));
writeFileSync("public/apple-touch-icon.png", drawIcon(180));
console.log("Icons generated!");
