export default function Greeting({ session }) {
  // 1. Get the current hour
  const hour = new Date().getHours();
  let timeGreeting = "Good Morning";
  if (hour >= 12) timeGreeting = "Good Afternoon";
  if (hour >= 17) timeGreeting = "Good Evening";

  // 2. Future-Proofing: Look for a real name in Supabase metadata
  // Right now this will be undefined, so it will skip the name part.
  // Later, when we build a Profile page, we can save { full_name: "Conor" } there.
  const name = session?.user?.user_metadata?.full_name;

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{ margin: 0, fontSize: "24px" }}>
        {timeGreeting}{name ? `, ${name}` : ''}!
      </h2>
      <p style={{ margin: "5px 0 0 0", color: "#666" }}>What have you experienced recently?</p>
    </div>
  );
}