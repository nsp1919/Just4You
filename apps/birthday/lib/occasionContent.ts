import { OccasionType } from "../../../packages/shared/src/types";

export interface OccasionContent {
  heroEmoji: string;
  heroSubtitle: string;
  heading2: string;
  subline2: string;
  letterSalutation: string;
  letterSignoff: string;
  specialItems: { emoji: string; text: string }[];
  confettiColors: string[];
  particles: string[];
  showProposalYes: boolean;
}

export function getOccasionContent(
  occasionType: OccasionType = "birthday",
  relation = "friend",
  relationCustom = "",
  recipientName = "there"
): OccasionContent {
  const firstName = recipientName.split(" ")[0];

  // Emojis, subtitles, headings and particles based on occasion
  let heroEmoji = "🎂";
  let heroSubtitle = "A Celebration For";
  let heading2 = "Happy Birthday! 🎉";
  let subline2 = "May this day be filled with all the magic you bring into the lives of everyone around you.";
  let letterSalutation = `Dear ${firstName},`;
  let letterSignoff = "With all my heart 💕";
  let confettiColors = ["#a855f7", "#f7d971", "#ec4899", "#ffffff", "#60a5fa"];
  let particles = ["✨", "⭐", "💫", "·", "✦", "✧"];
  let showProposalYes = false;

  // Determine occasion details
  if (occasionType === "kids-birthday") {
    heroEmoji = "🧸";
    heroSubtitle = "A Special Magical Day For";
    heading2 = "Happy Birthday! 🎈";
    subline2 = "Today is YOUR magical day! May it be filled with games, laughter, and endless fun!";
    letterSalutation = `Hey ${firstName}! 🌈`;
    letterSignoff = "Lots of love & hugs 🤗";
    confettiColors = ["#f43f5e", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"];
    particles = ["🎈", "🍭", "⭐", "🦄", "🧸", "✨", "🍬"];
  } else if (occasionType === "anniversary") {
    heroEmoji = "💍";
    heroSubtitle = "Celebrating Together";
    heading2 = "Happy Anniversary! 💑";
    subline2 = "Another beautiful year of sharing dreams, building memories, and loving each other more every day.";
    letterSalutation = `My Dearest ${firstName},`;
    letterSignoff = "Forever yours 💍";
    confettiColors = ["#fb7185", "#f472b6", "#fbbf24", "#e11d48", "#ffffff"];
    particles = ["🌹", "💎", "✨", "💍", "❤️", "🥂"];
  } else if (occasionType === "proposal") {
    heroEmoji = "💌";
    heroSubtitle = "A Question From The Heart";
    heading2 = "Will You Marry Me? 💍";
    subline2 = "You are my forever, my soulmate, and the best part of my every single day.";
    letterSalutation = `My Love,`;
    letterSignoff = "Yours, always 💌";
    confettiColors = ["#e11d48", "#ff4d6d", "#ff85a1", "#ffd166", "#ffffff"];
    particles = ["❤️", "💍", "🌹", "💌", "💖", "✨"];
    showProposalYes = true;
  }

  // Determine relation-specific details (Special list items & salutation overrides)
  let specialItems: { emoji: string; text: string }[] = [];

  const rel = (relation || "").toLowerCase();

  // Soulmates / Lovers (husband, wife, partner, spouse, girlfriend, boyfriend)
  if (["partner", "husband", "wife", "girlfriend", "boyfriend", "spouse"].includes(rel) || occasionType === "proposal" || occasionType === "anniversary") {
    specialItems = [
      { emoji: "💖", text: "You are the absolute love of my life" },
      { emoji: "✨", text: "You make every single ordinary day magical" },
      { emoji: "🌹", text: "Your smile is my favorite sight in the world" },
      { emoji: "♾️", text: "My heart is, and will always be, entirely yours" },
      { emoji: "🧸", text: "My favorite place is safe inside your warm embrace" },
      { emoji: "💫", text: "You make me want to be the best version of myself" },
    ];
    if (occasionType === "anniversary" || occasionType === "proposal") {
      letterSalutation = `My Darling ${firstName},`;
    }
  }
  // Kids (son, daughter, nephew, niece, grandchild, child)
  else if (["son", "daughter", "nephew", "niece", "grandchild", "child"].includes(rel) || occasionType === "kids-birthday") {
    specialItems = [
      { emoji: "🎈", text: "You bring so much playfulness and wonder into our lives" },
      { emoji: "⭐", text: "Always dream big, you can do anything you want!" },
      { emoji: "🧸", text: "Your cute laughter is the best sound in the world" },
      { emoji: "🚀", text: "We love watching you grow up and explore new things" },
      { emoji: "🌈", text: "You make the entire world so much brighter" },
      { emoji: "🍰", text: "May your day be filled with lots of games and treats!" },
    ];
  }
  // Parents (parent, grandparent)
  else if (["parent", "grandparent"].includes(rel)) {
    specialItems = [
      { emoji: "❤️", text: "Your unconditional love is my strongest anchor" },
      { emoji: "✨", text: "Thank you for all the sacrifices you made for me" },
      { emoji: "👵", text: "Your wisdom guides me in everything I do" },
      { emoji: "🏡", text: "You make home feel like the safest place on earth" },
      { emoji: "🌟", text: "You are my true role model and hero" },
      { emoji: "💐", text: "May your life be filled with the joy you gave to me" },
    ];
    letterSalutation = `Dear ${recipientName},`;
    letterSignoff = "With endless gratitude & love ❤️";
  }
  // Siblings (sibling)
  else if (["sibling"].includes(rel)) {
    specialItems = [
      { emoji: "🧑‍🤝‍🧑", text: "My first friend and my partner-in-crime for life" },
      { emoji: "💫", text: "No matter how much we argue, I always have your back" },
      { emoji: "🤪", text: "Thanks for sharing all the crazy childhood memories" },
      { emoji: "🛡️", text: "My ultimate secret-keeper and protector" },
      { emoji: "✨", text: "I'm so incredibly proud of the person you've become" },
      { emoji: "🍿", text: "May your year be as legendary as our late-night snacks!" },
    ];
  }
  // Colleagues (colleague)
  else if (["colleague"].includes(rel)) {
    specialItems = [
      { emoji: "💼", text: "You make even the busiest workdays feel lighter" },
      { emoji: "💡", text: "Your brilliance and ideas inspire the whole team" },
      { emoji: "🤝", text: "Always supportive, reliable, and ready to help out" },
      { emoji: "☕", text: "The best coffee-break partner anyone could ask for" },
      { emoji: "🏆", text: "A true professional, and an even better human being" },
      { emoji: "🚀", text: "May this year bring huge success to all your goals!" },
    ];
    letterSalutation = `Hey ${firstName},`;
    letterSignoff = "Cheers to your success! 🚀";
  }
  // Friends (friend, other, custom)
  else {
    specialItems = [
      { emoji: "🤝", text: "A truly loyal friend who is always there for me" },
      { emoji: "🍕", text: "The absolute best person to share pizzas and secrets with" },
      { emoji: "😂", text: "You know how to make me laugh when I'm feeling down" },
      { emoji: "🎒", text: "Cheers to all the adventures we've shared and those ahead" },
      { emoji: "🌟", text: "You are a rare gem, and I'm so lucky to have you" },
      { emoji: "🥂", text: "Here's to celebrating many more years of our friendship!" },
    ];
  }

  return {
    heroEmoji,
    heroSubtitle,
    heading2,
    subline2,
    letterSalutation,
    letterSignoff,
    specialItems,
    confettiColors,
    particles,
    showProposalYes,
  };
}
