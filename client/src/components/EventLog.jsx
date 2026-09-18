export default function EventLog({ events }) {
  return (
    <aside className="log">
      <h2>Dispatch log</h2>
      {events.length === 0 ? (
        <p>Waiting for requests…</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>{event.message}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}
