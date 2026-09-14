import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const stickerDir = path.resolve("marketing/instagram/reel-01-white-sticker-assets");
const outputDir = path.resolve("marketing/instagram/reel-01-typography-assets");
const iconMap = [1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10];

function stageSvg(iconOnLeft, showBrand = false, showCard = true) {
  const flower = (x, y, rotation) => `
    <g transform="translate(${x} ${y}) rotate(${rotation})">
      <ellipse cx="0" cy="-46" rx="26" ry="54" fill="#8B63C7" stroke="#3D275E" stroke-width="6"/>
      <ellipse cx="46" cy="0" rx="54" ry="26" fill="#A77DDB" stroke="#3D275E" stroke-width="6"/>
      <ellipse cx="0" cy="46" rx="26" ry="54" fill="#8B63C7" stroke="#3D275E" stroke-width="6"/>
      <ellipse cx="-46" cy="0" rx="54" ry="26" fill="#A77DDB" stroke="#3D275E" stroke-width="6"/>
      <circle r="19" fill="#FFD24A" stroke="#3D275E" stroke-width="6"/>
    </g>`;

  const iconX = iconOnLeft ? 48 : 782;
  const accentX = iconOnLeft ? 875 : 115;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <defs>
        <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="15" stdDeviation="14" flood-color="#000000" flood-opacity="0.22"/>
        </filter>
      </defs>
      <rect width="1080" height="1920" fill="#090A0E"/>
      <rect y="390" width="1080" height="930" fill="#FFDAB5"/>
      <rect y="390" width="1080" height="10" fill="#E6B887"/>
      <rect y="1310" width="1080" height="10" fill="#E6B887"/>
      ${flower(12, 420, -25)}
      ${flower(1068, 1290, 155)}
      <circle cx="${accentX}" cy="555" r="12" fill="#E8374F"/>
      <path d="M${accentX - 36} 600h72" stroke="#E8374F" stroke-width="10" stroke-linecap="round"/>
      ${showCard ? `<g filter="url(#cardShadow)">
        <rect x="${iconX}" y="940" width="250" height="300" rx="34" fill="#FFFFFF" stroke="#171D35" stroke-width="10"/>
      </g>` : ""}
      ${showBrand ? `<g transform="translate(319 1450)">
        <rect width="442" height="94" rx="47" fill="#14161D"/>
        <circle cx="55" cy="47" r="29" fill="#F45B69"/>
        <path d="M44 47l8 8 17-20" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="102" y="60" font-family="Trebuchet MS, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF">just4you.buzz</text>
      </g>` : ""}
    </svg>`;
}

await fs.mkdir(outputDir, { recursive: true });

for (const [index, iconNumber] of iconMap.entries()) {
  const iconOnLeft = index % 2 === 0;
  const showBrand = index === iconMap.length - 1;
  const iconX = iconOnLeft ? 63 : 797;
  const sourcePath = path.join(stickerDir, `scene-${String(iconNumber).padStart(2, "0")}.png`);
  const icon = await sharp(sourcePath)
    .extract({ left: 80, top: 250, width: 920, height: 1180 })
    .resize({ width: 220, height: 270, fit: "contain", background: "#FFFFFF" })
    .png()
    .toBuffer();

  const cardFrame = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="250" height="300">
      <rect x="5" y="5" width="240" height="290" rx="34" fill="#FFFFFF" stroke="#171D35" stroke-width="10"/>
    </svg>`);

  await sharp(cardFrame)
    .composite([{ input: icon, left: 15, top: 15 }])
    .png()
    .toFile(path.join(outputDir, `card-${String(index + 1).padStart(2, "0")}.png`));

  await sharp(Buffer.from(stageSvg(iconOnLeft, showBrand, false)))
    .png()
    .toFile(path.join(outputDir, `background-${String(index + 1).padStart(2, "0")}.png`));

  const scene = await sharp(Buffer.from(stageSvg(iconOnLeft, showBrand)))
    .composite([{ input: icon, left: iconX, top: 955 }])
    .png()
    .toFile(path.join(outputDir, `scene-${String(index + 1).padStart(2, "0")}.png`));

  void scene;
}

const coverOverlay = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
    <text x="540" y="665" text-anchor="middle" font-family="Impact, sans-serif" font-size="112" font-style="italic" fill="#FFD43B" stroke="#C6284A" stroke-width="18" paint-order="stroke">IDI ELA</text>
    <text x="540" y="805" text-anchor="middle" font-family="Impact, sans-serif" font-size="112" font-style="italic" fill="#FFD43B" stroke="#C6284A" stroke-width="18" paint-order="stroke">CHESAAVU?</text>
    <rect x="245" y="865" width="590" height="90" rx="45" fill="#171D35"/>
    <text x="540" y="925" text-anchor="middle" font-family="Trebuchet MS, sans-serif" font-size="38" font-weight="700" fill="#FFFFFF">Vallu adige surprise idi</text>
  </svg>`);

await sharp(path.join(outputDir, "scene-02.png"))
  .composite([{ input: coverOverlay, left: 0, top: 0 }])
  .png()
  .toFile(path.join(outputDir, "cover.png"));

await fs.writeFile(
  path.join(outputDir, "cover-options.txt"),
  [
    'Primary: "IDI ELA CHESAAVU?"',
    'Alternate A: "OKA LINK. BIG SURPRISE."',
    'Alternate B: "EE GIFT MARCHIPORU."',
  ].join("\n") + "\n",
  "utf8",
);

console.log(`Generated ${iconMap.length} typography scenes in ${outputDir}`);