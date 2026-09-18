export const FLOOR_COUNT = 10;
export const ELEVATOR_COUNT = 3;
export const MIN_FLOOR = 1;
export const MAX_FLOOR = FLOOR_COUNT;
export const TICK_MS = 600;
export const DOOR_DWELL_TICKS = 7;

export const INITIAL_FLOORS = Object.freeze([1, 2, 10]);

export const Direction = Object.freeze({
  UP: "up",
  DOWN: "down",
  IDLE: "idle",
});

export const DoorState = Object.freeze({
  OPEN: "open",
  CLOSED: "closed",
  OPENING: "opening",
  CLOSING: "closing",
});

export const ElevatorStatus = Object.freeze({
  IDLE: "idle",
  MOVING: "moving",
  LOADING: "loading",
});

export function oppositeDirection(direction) {
  if (direction === Direction.UP) return Direction.DOWN;
  if (direction === Direction.DOWN) return Direction.UP;
  return Direction.IDLE;
}
