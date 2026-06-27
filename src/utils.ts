/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function exportCardToPng(
  cardId: string,
  message: string,
  category: string,
  nickname: string,
  emoji: string,
  themeId: string,
  reply?: string
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920; // Perfect vertical story aspect ratio!
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Draw background based on theme
  const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
  
  if (themeId === 'sunset') {
    grad.addColorStop(0, '#ec4899'); // pink-500
    grad.addColorStop(0.5, '#ef4444'); // red-500
    grad.addColorStop(1, '#eab308'); // yellow-500
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);
  } else if (themeId === 'ocean') {
    grad.addColorStop(0, '#06b6d4'); // cyan-500
    grad.addColorStop(0.5, '#3b82f6'); // blue-500
    grad.addColorStop(1, '#10b981'); // emerald-500
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);
  } else if (themeId === 'fire') {
    grad.addColorStop(0, '#1c1917'); // stone-900
    grad.addColorStop(0.5, '#450a0a'); // red-950
    grad.addColorStop(1, '#b91c1c'); // red-700
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);
  } else if (themeId === 'cosmic') {
    grad.addColorStop(0, '#1e1b4b'); // indigo-950
    grad.addColorStop(0.5, '#090d16'); // dark space
    grad.addColorStop(1, '#4c1d95'); // purple-950
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);
    
    // Draw star/dust circles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 40; i++) {
      const starX = Math.random() * 1080;
      const starY = Math.random() * 1920;
      const starR = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(starX, starY, starR, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (themeId === 'matcha') {
    grad.addColorStop(0, '#f0fdf4'); // green-50
    grad.addColorStop(1, '#dcfce7'); // green-100
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);
  } else if (themeId === 'bubblegum') {
    grad.addColorStop(0, '#fce7f3'); // pink-100
    grad.addColorStop(0.5, '#fae8ff'); // purple-100
    grad.addColorStop(1, '#e0e7ff'); // indigo-100
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);
  } else if (themeId === 'clean') {
    // Swiss Minimalist (snow white background)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1080, 1920);
    
    // Draw subtle abstract grid lines
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.03)';
    ctx.lineWidth = 4;
    for (let x = 120; x < 1080; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1920);
      ctx.stroke();
    }
  } else if (themeId === 'gold') {
    // Luxury Gold Theme
    grad.addColorStop(0, '#09090b'); // zinc-950
    grad.addColorStop(1, '#18181b'); // zinc-900
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);
    
    // Draw luxury double thin borders
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1000, 1840);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, 984, 1824);
  } else {
    // Neon Cyberpunk fallback
    ctx.fillStyle = '#090514';
    ctx.fillRect(0, 0, 1080, 1920);
    
    // Cyberpunk grids
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
    ctx.lineWidth = 2;
    for (let y = 0; y < 1920; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }
  }

  // Draw outer neon border for neon theme
  if (themeId === 'neon') {
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, 1000, 1840);
    
    // Glow effect
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, 1000, 1840);
  }

  // Define Overlay Card Dimensions
  const cardX = 100;
  const cardY = reply ? 280 : 500;
  const cardW = 880;
  const cardH = reply ? 580 : 820;
  const cornerRadius = 48;

  // Set Card Background
  if (themeId === 'clean') {
    ctx.fillStyle = '#ffffff';
  } else if (themeId === 'gold') {
    ctx.fillStyle = 'rgba(12, 12, 14, 0.95)';
  } else if (themeId === 'matcha' || themeId === 'bubblegum') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  }

  // Draw Card Container
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cornerRadius);
  ctx.fill();

  // Draw Card Border
  if (themeId === 'clean') {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
  } else if (themeId === 'gold') {
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
  } else if (themeId === 'matcha') {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
  }
  ctx.stroke();

  // Color Configuration
  let textColor = '#ffffff';
  let badgeTextColor = '#ffffff';
  let badgeBg = 'rgba(255, 255, 255, 0.18)';
  let watermarkColor = 'rgba(255, 255, 255, 0.5)';
  let watermarkSubColor = 'rgba(255, 255, 255, 0.35)';

  if (themeId === 'matcha') {
    textColor = '#064e3b';
    badgeTextColor = '#065f46';
    badgeBg = 'rgba(4, 120, 87, 0.08)';
    watermarkColor = 'rgba(6, 78, 59, 0.6)';
    watermarkSubColor = 'rgba(6, 78, 59, 0.4)';
  } else if (themeId === 'bubblegum') {
    textColor = '#0f172a';
    badgeTextColor = '#1e293b';
    badgeBg = 'rgba(15, 23, 42, 0.06)';
    watermarkColor = 'rgba(15, 23, 42, 0.5)';
    watermarkSubColor = 'rgba(15, 23, 42, 0.35)';
  } else if (themeId === 'clean') {
    textColor = '#0f172a'; // Slate-900
    badgeTextColor = '#0f172a';
    badgeBg = '#f1f5f9';
    watermarkColor = '#0f172a';
    watermarkSubColor = '#64748b';
  } else if (themeId === 'gold') {
    textColor = '#fafafa';
    badgeTextColor = '#fbbf24'; // amber-400
    badgeBg = 'rgba(212, 175, 55, 0.12)';
    watermarkColor = '#fbbf24';
    watermarkSubColor = 'rgba(212, 175, 55, 0.6)';
  } else if (themeId === 'neon') {
    textColor = '#f3e8ff';
    badgeTextColor = '#e9d5ff';
    badgeBg = 'rgba(168, 85, 247, 0.18)';
  }

  // Draw Badge (Category)
  ctx.fillStyle = badgeBg;
  ctx.beginPath();
  ctx.roundRect(160, cardY + 80, 280, 70, 20);
  ctx.fill();

  if (themeId === 'gold') {
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Badge Text
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.fillStyle = badgeTextColor;
  ctx.textAlign = 'center';
  ctx.fillText(`${emoji} ${category}`, 300, cardY + 126);

  // Nickname
  ctx.font = '500 36px Inter, sans-serif';
  ctx.fillStyle = themeId === 'clean' ? '#e11d48' : textColor; // Rose accent for clean nickname
  ctx.textAlign = 'right';
  ctx.fillText(`- ${nickname}`, 880, cardY + 126);

  // Message Text wrapped
  ctx.font = 'italic 46px Inter, sans-serif';
  if (themeId === 'clean') {
    ctx.font = 'normal 46px sans-serif'; // Clean minimal sans
  }
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';

  const textX = 540;
  let textY = cardY + 250;
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
    if (textY < cardY + cardH - 60) {
      ctx.fillText(lines[i].trim(), textX, textY);
      textY += lineHeight;
    }
  }

  // Draw Reply bubble if provided
  if (reply) {
    const replyX = 100;
    const replyY = 920;
    const replyW = 880;
    const replyH = 450;
    const replyRadius = 48;

    // Background of reply box (contrasting beautiful bubble)
    if (themeId === 'clean') {
      ctx.fillStyle = '#1e293b'; // Slate-800
    } else if (themeId === 'matcha') {
      ctx.fillStyle = '#065f46'; // Emerald-800
    } else if (themeId === 'bubblegum') {
      ctx.fillStyle = '#ec4899'; // Pink-500
    } else if (themeId === 'gold') {
      ctx.fillStyle = '#fbbf24'; // Amber-400
    } else {
      ctx.fillStyle = '#ffffff'; // White for gorgeous high contrast with dark colors
    }

    ctx.beginPath();
    ctx.roundRect(replyX, replyY, replyW, replyH, replyRadius);
    ctx.fill();

    // Draw Reply Label
    ctx.font = 'bold 30px Inter, sans-serif';
    ctx.fillStyle = (themeId === 'clean' || themeId === 'matcha' || themeId === 'bubblegum') ? '#ffffff' : '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText(`REPLY:`, replyX + 60, replyY + 80);

    // Draw Reply Text wrapped
    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.fillStyle = (themeId === 'clean' || themeId === 'matcha' || themeId === 'bubblegum') ? '#ffffff' : '#0f172a';
    ctx.textAlign = 'center';

    const rTextX = 540;
    let rTextY = replyY + 180;
    const rMaxWidth = 760;
    const rLineHeight = 62;

    const rWords = reply.split(' ');
    let rLine = '';
    const rLines = [];

    for (let r = 0; r < rWords.length; r++) {
      const testRLine = rLine + rWords[r] + ' ';
      const rMetrics = ctx.measureText(testRLine);
      const rTestWidth = rMetrics.width;
      if (rTestWidth > rMaxWidth && r > 0) {
        rLines.push(rLine);
        rLine = rWords[r] + ' ';
      } else {
        rLine = testRLine;
      }
    }
    rLines.push(rLine);

    for (let j = 0; j < rLines.length; j++) {
      if (rTextY < replyY + replyH - 40) {
        ctx.fillText(rLines[j].trim(), rTextX, rTextY);
        rTextY += rLineHeight;
      }
    }
  }

  // Draw Brand Logo Watermark at bottom
  ctx.font = 'bold 50px Inter, sans-serif';
  ctx.fillStyle = watermarkColor;
  ctx.textAlign = 'center';
  ctx.fillText('Confessly', 540, 1520);

  ctx.font = '400 28px Inter, sans-serif';
  ctx.fillStyle = watermarkSubColor;
  ctx.fillText('Submit yours at: confessly.web', 540, 1570);

  // Download logic
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = reply ? `reply-${cardId}.png` : `confession-${cardId}.png`;
  link.href = dataUrl;
  link.click();
}
