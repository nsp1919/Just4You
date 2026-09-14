import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outputDir = path.resolve("marketing/instagram/reel-01-white-sticker-assets");

const palette = {
  ink: "#17213C",
  coral: "#F45B69",
  pink: "#FFB3C7",
  yellow: "#FFD166",
  blue: "#5CC8FF",
  green: "#69D49A",
  violet: "#8B7CF6",
  white: "#FFFFFF",
  soft: "#FFF7F8",
};

function base(content, accents = "") {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="22" stdDeviation="18" flood-color="#17213C" flood-opacity="0.16"/>
        </filter>
      </defs>
      <rect width="1080" height="1920" fill="${palette.white}"/>
      <circle cx="98" cy="230" r="12" fill="${palette.yellow}"/>
      <circle cx="955" cy="310" r="9" fill="${palette.blue}"/>
      <circle cx="920" cy="1270" r="13" fill="${palette.pink}"/>
      <path d="M120 1320c44-34 86-34 130 0" fill="none" stroke="${palette.violet}" stroke-width="12" stroke-linecap="round"/>
      <path d="M835 235l24-43 24 43 43 24-43 24-24 43-24-43-43-24z" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="8" stroke-linejoin="round"/>
      ${accents}
      <g filter="url(#shadow)">${content}</g>
    </svg>`;
}

const scenes = [
  base(`
    <g transform="translate(180 420) rotate(-3 360 360)">
      <rect x="90" y="310" width="540" height="390" rx="52" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="22"/>
      <path d="M360 310v390M90 470h540" stroke="${palette.yellow}" stroke-width="72"/>
      <rect x="55" y="235" width="610" height="130" rx="44" fill="${palette.pink}" stroke="${palette.ink}" stroke-width="22"/>
      <path d="M360 235c-150-8-214-80-160-142 64-73 160 45 160 142zm0 0c150-8 214-80 160-142-64-73-160 45-160 142z" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="20" stroke-linejoin="round"/>
      <path d="M120 760h480" stroke="${palette.ink}" stroke-width="18" stroke-linecap="round" opacity=".16"/>
    </g>
    <g transform="translate(260 1180) rotate(2 280 120)">
      <rect width="560" height="235" rx="34" fill="${palette.white}" stroke="${palette.ink}" stroke-width="18"/>
      <path d="M120 88h320M170 140h220" stroke="${palette.pink}" stroke-width="18" stroke-linecap="round"/>
      <path d="M280 198c-44-34-86-62-86-108 0-56 70-72 86-18 16-54 86-38 86 18 0 46-42 74-86 108z" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="12"/>
    </g>`),

  base(`
    <g transform="translate(255 350) rotate(4 285 480)">
      <rect width="570" height="980" rx="92" fill="${palette.ink}"/>
      <rect x="28" y="30" width="514" height="920" rx="70" fill="${palette.soft}" stroke="${palette.white}" stroke-width="8"/>
      <rect x="190" y="60" width="190" height="24" rx="12" fill="${palette.ink}"/>
      <circle cx="285" cy="400" r="165" fill="${palette.pink}" stroke="${palette.ink}" stroke-width="18"/>
      <circle cx="230" cy="360" r="18" fill="${palette.ink}"/><circle cx="340" cy="360" r="18" fill="${palette.ink}"/>
      <path d="M205 445c48 74 112 74 160 0" fill="none" stroke="${palette.ink}" stroke-width="22" stroke-linecap="round"/>
      <path d="M132 680h306" stroke="${palette.coral}" stroke-width="26" stroke-linecap="round"/>
      <path d="M172 745h226" stroke="${palette.yellow}" stroke-width="22" stroke-linecap="round"/>
      <circle cx="285" cy="850" r="46" fill="${palette.green}" stroke="${palette.ink}" stroke-width="14"/>
    </g>
    <g transform="translate(710 500) rotate(7)">
      <path d="M0 30q0-30 30-30h220q30 0 30 30v150q0 30-30 30H105l-72 72 18-72H30q-30 0-30-30z" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="16"/>
      <path d="M62 90h156M90 140h100" stroke="${palette.ink}" stroke-width="17" stroke-linecap="round"/>
    </g>`),

  base(`
    <g transform="translate(170 390)">
      <circle cx="370" cy="370" r="315" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="22"/>
      <circle cx="265" cy="300" r="28" fill="${palette.ink}"/><circle cx="475" cy="300" r="28" fill="${palette.ink}"/>
      <path d="M220 440c82 130 218 130 300 0" fill="${palette.white}" stroke="${palette.ink}" stroke-width="24" stroke-linejoin="round"/>
      <path d="M72 190c-72-38-65-126 8-127 36-72 135-31 124 45 73 30 44 129-31 119z" fill="${palette.pink}" stroke="${palette.ink}" stroke-width="16"/>
      <path d="M588 180l32-58 32 58 58 32-58 32-32 58-32-58-58-32z" fill="${palette.blue}" stroke="${palette.ink}" stroke-width="14"/>
    </g>
    <g transform="translate(170 1100)">
      <path d="M40 0h650q40 0 40 40v180q0 40-40 40H320l-95 90 24-90H40q-40 0-40-40V40Q0 0 40 0z" fill="${palette.white}" stroke="${palette.ink}" stroke-width="20"/>
      <path d="M120 98h490M180 164h370" stroke="${palette.coral}" stroke-width="24" stroke-linecap="round"/>
    </g>`),

  base(`
    <g transform="translate(95 360)">
      <g transform="rotate(-8 245 290)"><rect x="20" y="30" width="450" height="560" rx="36" fill="${palette.white}" stroke="${palette.ink}" stroke-width="20"/><rect x="65" y="75" width="360" height="350" rx="24" fill="${palette.blue}"/><circle cx="245" cy="230" r="95" fill="${palette.yellow}"/><path d="M95 380l120-135 88 92 76-80 46 168H65z" fill="${palette.green}"/></g>
      <g transform="translate(480 95) rotate(8 190 250)"><rect width="380" height="500" rx="34" fill="${palette.white}" stroke="${palette.ink}" stroke-width="20"/><path d="M70 110h240M70 180h240M70 250h175" stroke="${palette.pink}" stroke-width="22" stroke-linecap="round"/><path d="M190 430c-58-44-112-84-112-145 0-72 88-90 112-22 24-68 112-50 112 22 0 61-54 101-112 145z" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="14"/></g>
      <g transform="translate(245 650)"><circle cx="255" cy="255" r="220" fill="${palette.violet}" stroke="${palette.ink}" stroke-width="22"/><circle cx="255" cy="255" r="72" fill="${palette.white}" stroke="${palette.ink}" stroke-width="18"/><circle cx="255" cy="255" r="22" fill="${palette.coral}"/><path d="M610 55v310c0 60-92 75-122 22-31-56 28-116 96-82V55z" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="20" stroke-linejoin="round"/></g>
    </g>`),

  base(`
    <g transform="translate(115 360)">
      <rect x="70" y="60" width="720" height="500" rx="70" fill="${palette.soft}" stroke="${palette.ink}" stroke-width="22"/>
      <circle cx="430" cy="310" r="170" fill="${palette.white}" stroke="${palette.ink}" stroke-width="20"/>
      <path d="M430 310V195M430 310l98 56" stroke="${palette.coral}" stroke-width="26" stroke-linecap="round"/>
      <circle cx="430" cy="310" r="24" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="10"/>
      <path d="M225 660c0-55 45-100 100-100h410c55 0 100 45 100 100v230c0 55-45 100-100 100H325c-55 0-100-45-100-100z" fill="${palette.blue}" stroke="${palette.ink}" stroke-width="22"/>
      <path d="M325 680l205 160 205-160M325 890l145-125M735 890L590 765" fill="none" stroke="${palette.ink}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(540 920)"><circle cx="0" cy="0" r="105" fill="${palette.pink}" stroke="${palette.ink}" stroke-width="18"/><path d="M0 62c-58-44-98-76-98-126 0-62 76-78 98-20 22-58 98-42 98 20 0 50-40 82-98 126z" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="12"/></g>
    </g>`),

  base(`
    <g transform="translate(85 330)">
      <circle cx="455" cy="520" r="230" fill="${palette.soft}" stroke="${palette.ink}" stroke-width="20" stroke-dasharray="28 22"/>
      <g transform="translate(45 80)"><rect width="250" height="240" rx="55" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="18"/><path d="M70 140h110M85 90v-38M165 90v-38" stroke="${palette.white}" stroke-width="22" stroke-linecap="round"/><path d="M70 180h110" stroke="${palette.yellow}" stroke-width="20"/></g>
      <g transform="translate(590 50)"><circle cx="125" cy="125" r="120" fill="${palette.pink}" stroke="${palette.ink}" stroke-width="18"/><path d="M65 65l120 120M185 65L65 185" stroke="${palette.coral}" stroke-width="28" stroke-linecap="round"/><circle cx="125" cy="125" r="40" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="12"/></g>
      <g transform="translate(620 680)"><path d="M0 100L150 10l150 90-150 90z" fill="${palette.violet}" stroke="${palette.ink}" stroke-width="18"/><path d="M65 145v110c80 50 160 50 230 0V145" fill="${palette.blue}" stroke="${palette.ink}" stroke-width="18"/><path d="M300 100v190" stroke="${palette.ink}" stroke-width="18"/><circle cx="300" cy="310" r="28" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="12"/></g>
      <g transform="translate(45 735)"><path d="M45 0h250q45 0 45 45v180q0 45-45 45H180l-90 82 22-82H45q-45 0-45-45V45Q0 0 45 0z" fill="${palette.green}" stroke="${palette.ink}" stroke-width="18"/><path d="M85 115h170M110 180h120" stroke="${palette.white}" stroke-width="22" stroke-linecap="round"/></g>
      <path d="M455 410c-90-72-185-132-185-235 0-122 150-150 185-37 35-113 185-85 185 37 0 103-95 163-185 235z" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="22"/>
      <path d="M330 505h250M365 570h180" stroke="${palette.ink}" stroke-width="24" stroke-linecap="round"/>
    </g>`),

  base(`
    <g transform="translate(115 380)">
      <circle cx="425" cy="425" r="380" fill="${palette.soft}" stroke="${palette.ink}" stroke-width="20"/>
      <g transform="translate(110 130) rotate(-12 160 190)"><rect width="320" height="390" rx="42" fill="${palette.green}" stroke="${palette.ink}" stroke-width="20"/><circle cx="160" cy="120" r="65" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="14"/><path d="M75 300c26-92 144-92 170 0" fill="${palette.white}" stroke="${palette.ink}" stroke-width="18"/></g>
      <g transform="translate(425 125) rotate(10 160 190)"><rect width="320" height="390" rx="42" fill="${palette.blue}" stroke="${palette.ink}" stroke-width="20"/><circle cx="160" cy="120" r="65" fill="${palette.pink}" stroke="${palette.ink}" stroke-width="14"/><path d="M75 300c26-92 144-92 170 0" fill="${palette.white}" stroke="${palette.ink}" stroke-width="18"/></g>
      <path d="M425 650c-116-88-218-163-218-283 0-145 174-177 218-42 44-135 218-103 218 42 0 120-102 195-218 283z" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="24"/>
      <circle cx="425" cy="425" r="42" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="14"/>
    </g>`),

  base(`
    <g transform="translate(100 420)">
      <rect x="60" y="120" width="760" height="720" rx="78" fill="${palette.soft}" stroke="${palette.ink}" stroke-width="22"/>
      <circle cx="300" cy="365" r="180" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="20"/>
      <circle cx="245" cy="330" r="20" fill="${palette.ink}"/><circle cx="355" cy="330" r="20" fill="${palette.ink}"/>
      <path d="M230 420c44 68 96 68 140 0" fill="none" stroke="${palette.ink}" stroke-width="20" stroke-linecap="round"/>
      <path d="M520 280h210M520 360h210M520 440h150" stroke="${palette.pink}" stroke-width="26" stroke-linecap="round"/>
      <path d="M470 680c-64-49-124-92-124-160 0-82 102-104 124-25 22-79 124-57 124 25 0 68-60 111-124 160z" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="16"/>
      <path d="M660 625l42 78 86 14-62 61 15 86-81-40-80 40 15-86-62-61 86-14z" fill="${palette.violet}" stroke="${palette.ink}" stroke-width="16" stroke-linejoin="round"/>
    </g>`),

  base(`
    <g transform="translate(130 470)">
      <path d="M70 0h680q70 0 70 70v470q0 70-70 70H410L240 770l44-160H70Q0 610 0 540V70Q0 0 70 0z" fill="${palette.blue}" stroke="${palette.ink}" stroke-width="24"/>
      <path d="M170 175h480M225 270h370" stroke="${palette.white}" stroke-width="34" stroke-linecap="round"/>
      <rect x="240" y="365" width="340" height="110" rx="55" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="18"/>
      <path d="M315 420h190" stroke="${palette.white}" stroke-width="28" stroke-linecap="round"/>
      <circle cx="705" cy="85" r="85" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="18"/>
      <path d="M675 85l22 22 42-48" fill="none" stroke="${palette.ink}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`),

  base(`
    <g transform="translate(170 360)">
      <rect x="40" y="80" width="660" height="880" rx="92" fill="${palette.ink}"/>
      <rect x="72" y="116" width="596" height="810" rx="62" fill="${palette.soft}"/>
      <circle cx="370" cy="380" r="175" fill="${palette.pink}" stroke="${palette.ink}" stroke-width="18"/>
      <path d="M325 305l150 75-150 75z" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="16" stroke-linejoin="round"/>
      <path d="M170 650h400M220 730h300" stroke="${palette.blue}" stroke-width="28" stroke-linecap="round"/>
      <path d="M370 880c-58-44-112-84-112-145 0-72 88-90 112-22 24-68 112-50 112 22 0 61-54 101-112 145z" fill="${palette.yellow}" stroke="${palette.ink}" stroke-width="14"/>
    </g>`),
];

await fs.mkdir(outputDir, { recursive: true });

for (const [index, scene] of scenes.entries()) {
  const filename = `scene-${String(index + 1).padStart(2, "0")}.png`;
  await sharp(Buffer.from(scene)).png().toFile(path.join(outputDir, filename));
}

console.log(`Generated ${scenes.length} sticker scenes in ${outputDir}`);