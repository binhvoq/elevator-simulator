import { useEffect, useMemo, useState } from "react";
import socket from "./socket.js";
import ElevatorColumn from "./components/ElevatorColumn.jsx";
import EventLog from "./components/EventLog.jsx";

export default function App() {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onState = (next) => setState(next);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("state", onState);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);
    fetch("/api/state")
      .then((res) => res.json())
      .then(setState)
      .catch(() => {});

    return () => {
      socket.off("state", onState);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const floors = useMemo(() => {
    const count = state?.floorCount ?? 10;
    return Array.from({ length: count }, (_, index) => count - index);
  }, [state?.floorCount]);

  const selecting = (state?.elevators ?? []).filter(
    (elevator) =>
      elevator.currentFloor &&
      (elevator.doorState === "open" || elevator.doorState === "opening")
  );

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Elevator Simulator</h1>
          <p>3 cars · 10 floors · per-car hall buttons</p>
        </div>
        <div className="topbar-actions">
          <span className={`badge ${connected ? "on" : "off"}`}>
            {connected ? "Live" : "Disconnected"}
          </span>
          <button type="button" onClick={() => socket.emit("reset")}>
            Reset
          </button>
        </div>
      </header>

      <p className="hint">
        Each car has its own ▲ / ▼. Press the buttons beside the car you want;
        only that car lights up and responds. Walk to another shaft and press
        its buttons to call a second car. When the door opens, click another
        floor in that shaft for the destination. <strong>◀▶</strong> holds the
        door, <strong>▶◀</strong> closes it. A moving car only stops for hall
        calls in its current direction.
      </p>

      <div className="bank">
        {(state?.elevators ?? [{ id: 1 }, { id: 2 }, { id: 3 }]).map(
          (elevator) => (
            <ElevatorColumn
              key={elevator.id}
              elevator={elevator}
              floors={floors}
            />
          )
        )}
      </div>

      <div className="select-hint-slot">
        {selecting.length > 0 && (
          <p className="hint select-hint">
            Door open on elevator {selecting.map((item) => item.id).join(", ")} —
            click a floor to choose destination.
          </p>
        )}
      </div>

      <EventLog events={state?.events ?? []} />
    </div>
  );
}
