import { Clock, Gift, Images, Lock, MessageCircle, Music2, Share2, Shield, Zap } from 'lucide-react'
import { BASE_PRICE_INR } from './marketing-config'

export const OCCASIONS = [
  { emoji: '🎂', title: 'Birthday Websites', tag: 'Most Popular', c: '#ff9e4f', bg: 'rgba(255,158,79,0.06)', border: 'rgba(255,158,79,0.16)', desc: 'A personalized birthday page packed with photos, music, countdown & a heartfelt surprise reveal.' },
  { emoji: '💍', title: 'Anniversary Websites', tag: 'Most Romantic', c: '#ff6f9c', bg: 'rgba(255,111,156,0.06)', border: 'rgba(255,111,156,0.16)', desc: 'Celebrate years of togetherness with a stunning timeline of shared memories & love letters.' },
  { emoji: '💌', title: 'Proposal Websites', tag: 'Trending', c: '#ff5f8f', bg: 'rgba(255,95,143,0.06)', border: 'rgba(255,95,143,0.16)', desc: 'Pop the question with a cinematic digital story — photos, vows & a Yes/No reveal moment.' },
  { emoji: '🧸', title: 'Kids Birthday', tag: 'Adorable', c: '#ffbe3d', bg: 'rgba(255,190,61,0.06)', border: 'rgba(255,190,61,0.16)', desc: 'Colorful, playful birthday pages with balloon animations, character themes & fun surprises.' },
  { emoji: '🎓', title: 'Graduation Websites', tag: 'New ✨', c: '#f7a83a', bg: 'rgba(247,168,58,0.06)', border: 'rgba(247,168,58,0.16)', desc: 'Honour the achievement with a premium tribute — professor wishes, milestone photos & a proud message.' },
  { emoji: '🎉', title: 'Custom Celebrations', tag: 'Fully Custom', c: '#ff7d6b', bg: 'rgba(255,125,107,0.06)', border: 'rgba(255,125,107,0.16)', desc: 'Weddings, engagements, reunions, farewells — any occasion crafted beautifully, just for you.' },
]

export const THEMES = [
  { id: 'galaxy', emoji: '🌌', name: 'Galaxy Theme', desc: 'Deep space vibes — floating stars, nebula glow & cosmic gold typography.' },
  { id: 'floral', emoji: '🌸', name: 'Floral Theme', desc: 'Romantic pink petals, soft cream backgrounds & elegant serif typography.' },
  { id: 'neon', emoji: '⚡', name: 'Neon Theme', desc: 'Electric cyberpunk aesthetic — bright neon accents on a dark slate canvas.' },
  { id: 'minimal', emoji: '🤍', name: 'Minimal Theme', desc: 'Clean white space, minimal typography, and focused layout elegance.' },
  { id: 'retro', emoji: '🎞️', name: 'Retro Theme', desc: 'Warm vintage film tones, typewriter text & sepia charm.' },
  { id: 'magical', emoji: '🎈', name: 'Magical Theme', desc: 'Playful cartoonish elements — floating balloons & light pastel tones.' },
]

export const HOW_IT_WORKS = [
  { n: '01', title: 'Choose Your Occasion', desc: 'Select from Birthday, Anniversary, Proposal, Kids Birthday, Graduation, or create a fully custom celebration website.', emoji: '🎯' },
  { n: '02', title: 'Fill In The Details', desc: "Add the recipient's name, your heartfelt personal message, pick a beautiful visual theme & set the celebration date.", emoji: '✍️' },
  { n: '03', title: 'Upload Photos & Music', desc: 'Add up to 8 photos, choose a preset music track or upload your own song, even record a personal voice message.', emoji: '📸' },
  { n: '04', title: 'Secure Check & Go Live', desc: 'Complete secure payments. Your beautiful surprise website is ready within 24 hours — sometimes instantly!', emoji: '✅' },
]

export const FEATURES = [
  { icon: Images, title: 'Photo Gallery', desc: 'Upload up to 8 photos in a stunning animated slideshow.', color: '#ff9e4f' },
  { icon: Music2, title: 'Custom Music & Voice', desc: 'Choose from preset tracks, upload your own song, or record a voice note.', color: '#ff6f9c' },
  { icon: Clock, title: 'Countdown Reveal', desc: 'Lock the site until the big day with an animated countdown timer.', color: '#ffbe3d' },
  { icon: MessageCircle, title: 'Guest Wishes Section', desc: 'Allow friends & family to leave messages on the surprise page.', color: '#ff7d6b' },
  { icon: Lock, title: 'Password Protected', desc: 'Ensure absolute privacy with optional passcode protection.', color: '#f7a83a' },
  { icon: Gift, title: '6 Premium Themes', desc: 'Pick the theme that matches their vibe perfectly.', color: '#fb923c' },
  { icon: Zap, title: 'Ready in 24 Hours', desc: 'Express delivery ensuring your site goes live on schedule.', color: '#ff9e4f' },
  { icon: Share2, title: 'Easy Sharing', desc: 'Get one beautiful link to share via WhatsApp, Instagram, or email.', color: '#ff6f9c' },
  { icon: Shield, title: 'Hosted 1 Full Year', desc: 'Secure hosting active for 365 days of celebration.', color: '#ffbe3d' },
]

export const TESTIMONIALS = [
  { init: 'PM', name: 'Priya Mehta', loc: 'Mumbai', occ: 'Birthday', c: '#ff9e4f', bg: 'rgba(255,158,79,0.14)', text: 'My husband literally cried when he saw it. The photos, the music, the messages from family — it was beyond anything I could have imagined. Pure magic! 🥹', rating: 5 },
  { init: 'RS', name: 'Rahul Sharma', loc: 'Delhi', occ: 'Proposal', c: '#ff6f9c', bg: 'rgba(255,111,156,0.14)', text: 'I proposed using the website and she said YES! The countdown, the love story, the photos — she was completely speechless. Best decision of my life.', rating: 5 },
  { init: 'AS', name: 'Arjun & Sneha', loc: 'Bangalore', occ: 'Anniversary', c: '#ff5f8f', bg: 'rgba(255,95,143,0.14)', text: 'For our 10th anniversary, the team created a beautiful timeline of our decade together. Our entire family is still talking about it months later!', rating: 5 },
  { init: 'KN', name: 'Kavya Nair', loc: 'Kochi', occ: 'Kids Birthday', c: '#ffbe3d', bg: 'rgba(255,190,61,0.14)', text: "My daughter's 5th birthday website had her favourite characters and all her friends' wishes. She watches it every week — her most treasured memory!", rating: 5 },
  { init: 'VP', name: 'Vikram Patel', loc: 'Ahmedabad', occ: 'Graduation', c: '#f7a83a', bg: 'rgba(247,168,58,0.14)', text: `Made a graduation surprise for my sister — prof messages, college memories, achievement showcase. She cried happy tears. Best ₹${BASE_PRICE_INR} ever spent!`, rating: 5 },
]

export const PARTICLES = Array.from({ length: 15 }, (_, id) => ({
  id,
  size: Math.random() * 3 + 2,
  left: Math.random() * 100,
  delay: Math.random() * 10,
  dur: Math.random() * 8 + 8,
  color: ['#ff9e4f', '#ff6f9c', '#ffcf7a', '#ff8a5c', '#ffe6b0'][Math.floor(Math.random() * 5)],
}))
