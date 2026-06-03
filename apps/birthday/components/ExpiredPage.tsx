export default function ExpiredPage({ name }: { name: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center text-center px-6"
      style={{ background: "#0a0612", color: "#f8f4ff", fontFamily: "system-ui, sans-serif" }}>
      <div>
        <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>⏰</div>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          This page has expired
        </h1>
        <p style={{ color: "#9b8ec4", marginBottom: "2rem" }}>
          The surprise website for <strong style={{ color: "#f8f4ff" }}>{name}</strong> has expired after 1 year.
        </p>
        <a href="https://just4you.in"
          style={{
            background: "linear-gradient(135deg, #a855f7, #ec4899)",
            color: "white", textDecoration: "none", padding: "1rem 2rem",
            borderRadius: "9999px", fontWeight: 600, display: "inline-block",
          }}>
          ✨ Create a New surprise Website
        </a>
      </div>
    </main>
  );
}
