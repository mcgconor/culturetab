function DailyQuote({ text, author }) {
  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", margin: "20px 0" }}>
      <h3>Quote of the Day</h3>
      <p style={{ fontStyle: "italic" }}>
        "{text}" 
      </p>
      <small>- {author}</small>
    </div>
  );
}

export default DailyQuote;