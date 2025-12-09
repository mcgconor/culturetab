function Greeting() {
  const date = new Date();
  const hours = date.getHours();
  let greet = "Hello";

  if (hours < 12) {
    greet = "Good Morning";
  } else if (hours < 18) {
    greet = "Good Afternoon";
  } else {
    greet = "Good Evening";
  }

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2>{greet}, Conor!</h2>
      <p>Here is your daily dose of culture.</p>
    </div>
  );
}

export default Greeting;