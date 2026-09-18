import socket from "../socket.js";

function HallButtons({ elevatorId, floor, maxFloor, lights }) {
  const upActive = Boolean(lights?.up);
  const downActive = Boolean(lights?.down);

  return (
    <div className="hall">
      {floor < maxFloor && (
        <button
          type="button"
          className={`round-btn ${upActive ? "active" : ""}`}
          aria-label={`Call car ${elevatorId} up at floor ${floor}`}
          onClick={() =>
            socket.emit("hallCall", {
              elevatorId,
              floor,
              direction: "up",
            })
          }
        >
          ▲
        </button>
      )}
      {floor > 1 && (
        <button
          type="button"
          className={`round-btn ${downActive ? "active" : ""}`}
          aria-label={`Call car ${elevatorId} down at floor ${floor}`}
          onClick={() =>
            socket.emit("hallCall", {
              elevatorId,
              floor,
              direction: "down",
            })
          }
        >
          ▼
        </button>
      )}
    </div>
  );
}

function DoorButtons({ elevatorId, floor, enabled }) {
  return (
    <div className="door-btns">
      <button
        type="button"
        className="round-btn door-open"
        disabled={!enabled}
        aria-label={`Keep door open at floor ${floor}`}
        onClick={() =>
          socket.emit("doorCommand", {
            elevatorId,
            floor,
            action: "open",
          })
        }
      >
        ◀▶
      </button>
      <button
        type="button"
        className="round-btn door-close"
        disabled={!enabled}
        aria-label={`Close door at floor ${floor}`}
        onClick={() =>
          socket.emit("doorCommand", {
            elevatorId,
            floor,
            action: "close",
          })
        }
      >
        ▶◀
      </button>
    </div>
  );
}

function Cabin({ elevator, floor, selectable }) {
  const here = elevator.currentFloor === floor;
  const open =
    here &&
    (elevator.doorState === "open" || elevator.doorState === "opening");
  const closing = here && elevator.doorState === "closing";
  const destination = elevator.carStops?.includes(floor);

  const onPick = () => {
    if (!selectable || here) return;
    socket.emit("carCall", { elevatorId: elevator.id, floor });
  };

  return (
    <button
      type="button"
      className={[
        "cabin",
        here ? "current" : "",
        open ? "open" : "",
        closing ? "closing" : "",
        destination ? "destination" : "",
        selectable && !here ? "selectable" : "",
      ].join(" ")}
      onClick={onPick}
      disabled={!selectable || here}
    >
      <span className="cabin-label">{floor}</span>
      <span className="doors">
        <span className="leaf left" />
        <span className="leaf right" />
      </span>
      {here && elevator.direction !== "idle" && (
        <span className="dir-tag">{elevator.direction === "up" ? "▲" : "▼"}</span>
      )}
    </button>
  );
}

export default function ElevatorColumn({ elevator, floors }) {
  const maxFloor = floors[0] ?? 10;
  const doorOpen =
    elevator.doorState === "open" || elevator.doorState === "opening";
  const canSelectDestination =
    doorOpen || elevator.doorState === "closing";

  return (
    <section className="shaft">
      <div className="shaft-title">
        Car {elevator.id}
        <small>
          {elevator.status ?? "idle"}
          {elevator.currentFloor ? ` · F${elevator.currentFloor}` : ""}
        </small>
      </div>
      {floors.map((floor) => {
        const here = elevator.currentFloor === floor;
        return (
          <div className="floor-row" key={floor}>
            <HallButtons
              elevatorId={elevator.id}
              floor={floor}
              maxFloor={maxFloor}
              lights={elevator.hallLights?.[floor]}
            />
            <Cabin
              elevator={elevator}
              floor={floor}
              selectable={canSelectDestination}
            />
            <DoorButtons
              elevatorId={elevator.id}
              floor={floor}
              enabled={here}
            />
          </div>
        );
      })}
      {canSelectDestination && (
        <div className="dest-pad">
          {floors
            .slice()
            .reverse()
            .map((floor) => (
              <button
                key={floor}
                type="button"
                className={
                  elevator.carStops?.includes(floor) ? "picked" : ""
                }
                disabled={elevator.currentFloor === floor}
                onClick={() =>
                  socket.emit("carCall", { elevatorId: elevator.id, floor })
                }
              >
                {floor}
              </button>
            ))}
        </div>
      )}
    </section>
  );
}
