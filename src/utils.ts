/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function exportCardToPng(cardId: string, message: string, category: string, nickname: string, emoji: string, themeId: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920; // Perfect vertical story aspect ratio!
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Draw gradient background based on theme
  const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
  if (themeId === 'sunset') {
    grad.addColorStop(0, '#ec4899'); // pink-500
    grad.addColorStop(0.5, '#ef4444'); // red-500
    grad.addColorStop(1, '#eab308'); // yellow-500
  } else if (themeId === 'ocean') {
    grad.addColorStop(0, '#2563eb'); // blue-600
    grad.addColorStop(1, '#10b981'); // emerald-500
  } else if (themeId === 'fire') {
    grad.addColorStop(0, '#1c1917'); // stone-900
    grad.addColorStop(0.5, '#431407'); // orange-950
    grad.addColorStop(1, '#dc2626'); // red-600
  } else if (themeId === 'cosmic') {
    grad.addColorStop(0, '#312e81'); // indigo-950
    grad.addColorStop(0.5, '#0f172a'); // slate-900
    grad.addColorStop(1, '#581c87'); // purple-950
  } else if (themeId === 'matcha') {
    grad.addColorStop(0, '#d1fae5'); // emerald-100
    grad.addColorStop(1, '#d9f99d'); // lime-100
  } else if (themeId === 'bubblegum') {
    grad.addColorStop(0, '#fbcfe8'); // pink-300
    grad.addColorStop(0.5, '#e9d5ff'); // purple-300
    grad.addColorStop(1, '#c7d2fe'); // indigo-300
  } else {
    // Neon Night or default Night fallback
    grad.addColorStop(0, '#090514');
    grad.addColorStop(1, '#020105');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // If neon theme, draw glowing purple/blue borders
  if (themeId === 'neon') {
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, 1000, 1840);
  }

  // Draw overlay card
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  if (themeId === 'matcha' || themeId === 'bubblegum') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  }
  
  const cardX = 100;
  const cardY = 500;
  const cardW = 880;
  const cardH = 800;
  const cornerRadius = 40;

  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cornerRadius);
  ctx.fill();

  // Draw card border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  if (themeId === 'matcha') ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Font color settings
  let textColor = '#ffffff';
  let badgeTextColor = '#ffffff';
  let badgeBg = 'rgba(255, 255, 255, 0.2)';
  if (themeId === 'matcha') {
    textColor = '#064e3b';
    badgeTextColor = '#065f46';
    badgeBg = 'rgba(4, 120, 87, 0.1)';
  } else if (themeId === 'bubblegum') {
    textColor = '#0f172a';
    badgeTextColor = '#1e293b';
    badgeBg = 'rgba(15, 23, 42, 0.08)';
  } else if (themeId === 'neon') {
    textColor = '#f3e8ff';
    badgeTextColor = '#e9d5ff';
    badgeBg = 'rgba(168, 85, 247, 0.2)';
  }

  // Draw Badge (Category)
  ctx.fillStyle = badgeBg;
  ctx.beginPath();
  ctx.roundRect(160, 580, 280, 70, 20);
  ctx.fill();

  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.fillStyle = badgeTextColor;
  ctx.textAlign = 'center';
  ctx.fillText(`${emoji} ${category}`, 300, 626);

  // Draw Nickname
  ctx.font = '500 36px Inter, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'right';
  ctx.fillText(`- ${nickname}`, 880, 626);

  // Draw Message Text (Wrapped)
  ctx.font = 'italic 46px Inter, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  
  const textX = 540;
  let textY = 740;
  const maxWidth = 760;
  const lineHeight = 65;

  // Word wrap helper
  const words = message.split(' ');
  let line = '';
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  for (let i = 0; i < lines.length; i++) {
    if (textY < 1200) {
      ctx.fillText(lines[i].trim(), textX, textY);
      textY += lineHeight;
    }
  }

  // Draw Logo / Watermark
  ctx.font = 'bold 50px Inter, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.fillText('Confessly', 540, 1500);

  ctx.font = '400 28px Inter, sans-serif';
  ctx.fillStyle = themeId === 'matcha' || themeId === 'bubblegum' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('Submit yours at: confessly.web', 540, 1550);

  // Generate Image Link
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `confession-${cardId}.png`;
  link.href = dataUrl;
  link.click();
}
