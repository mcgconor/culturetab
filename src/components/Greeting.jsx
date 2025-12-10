export default function Greeting({ session }) {
  const hour = new Date().getHours();
  let timeGreeting = "Good Morning";
  if (hour >= 12) timeGreeting = "Good Afternoon";
  if (hour >= 17) timeGreeting = "Good Evening";

  const name = session?.user?.user_metadata?.full_name;

  return (
    <div className="mb-8 border-b border-gray-100 pb-6">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">
        {timeGreeting}{name ? `, ${name}` : ''}!
      </h2>
      <p className="mt-2 text-lg text-gray-500">
        What have you experienced recently?
      </p>
    </div>
  );
}