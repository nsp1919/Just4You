const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "connect-src 'self' https://api.cloudinary.com https://*.googleapis.com https://*.firebaseio.com https://checkout.razorpay.com https://api.razorpay.com",
  "frame-src https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  "report-uri /api/csp-report",
].join("; ");

// Report-only first: collect real Razorpay, Firebase, Cloudinary, and theme
// requirements before promoting this policy to enforcement.
const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.trycloudflare.com", "*.devtunnels.ms"],
};

export default nextConfig;