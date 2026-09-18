import {
  Direction,
  DoorState,
  ElevatorStatus,
  DOOR_DWELL_TICKS,
} from "../constants.js";

export class Elevator {
  #id;
  #currentFloor;
  #direction;
  #doorState;
  #status;
  #carFloors;
  #hallCalls;
  #holdOpen;
  #forceClose;
  #dwellRemaining;

  constructor(id, currentFloor) {
    this.#id = id;
    this.#currentFloor = currentFloor;
    this.#direction = Direction.IDLE;
    this.#doorState = DoorState.CLOSED;
    this.#status = ElevatorStatus.IDLE;
    this.#carFloors = new Set();
    this.#hallCalls = new Map();
    this.#holdOpen = false;
    this.#forceClose = false;
    this.#dwellRemaining = 0;
  }

  get id() {
    return this.#id;
  }

  get currentFloor() {
    return this.#currentFloor;
  }

  get direction() {
    return this.#direction;
  }

  get doorState() {
    return this.#doorState;
  }

  get status() {
    return this.#status;
  }

  get holdOpen() {
    return this.#holdOpen;
  }

  getCommittedFloors() {
    return new Set([...this.#carFloors, ...this.#hallCalls.keys()]);
  }

  hasWork() {
    return this.#carFloors.size > 0 || this.#hallCalls.size > 0;
  }

  hasHallCall(floor, direction) {
    return this.#hallCalls.get(floor)?.has(direction) ?? false;
  }

  assignHallRequest(request) {
    const dirs = this.#hallCalls.get(request.floor) ?? new Set();
    dirs.add(request.direction);
    this.#hallCalls.set(request.floor, dirs);

    if (this.#direction === Direction.IDLE) {
      if (request.floor === this.#currentFloor) {
        this.#direction = request.direction;
        this.#beginOpening();
      } else {
        this.#direction =
          request.floor > this.#currentFloor ? Direction.UP : Direction.DOWN;
        this.#status = ElevatorStatus.MOVING;
      }
    }
  }

  addCarRequest(request) {
    if (request.floor === this.#currentFloor) {
      if (this.#doorState === DoorState.CLOSED) {
        this.#beginOpening();
      } else if (this.#doorState === DoorState.CLOSING) {
        this.#doorState = DoorState.OPENING;
        this.#status = ElevatorStatus.LOADING;
      }
      return;
    }

    this.#carFloors.add(request.floor);

    if (this.#direction === Direction.IDLE) {
      this.#direction =
        request.floor > this.#currentFloor ? Direction.UP : Direction.DOWN;
      if (this.#doorState === DoorState.CLOSED) {
        this.#status = ElevatorStatus.MOVING;
      }
    }
  }

  openDoor() {
    this.#holdOpen = true;
    this.#forceClose = false;
    this.#dwellRemaining = DOOR_DWELL_TICKS;

    if (this.#doorState === DoorState.OPEN) {
      return;
    }

    if (
      this.#doorState === DoorState.CLOSED ||
      this.#doorState === DoorState.CLOSING
    ) {
      this.#beginOpening();
    }
  }

  closeDoor() {
    this.#holdOpen = false;
    this.#forceClose = true;
    if (
      this.#doorState === DoorState.OPEN ||
      this.#doorState === DoorState.OPENING
    ) {
      this.#doorState = DoorState.CLOSING;
    }
  }

  tick() {
    switch (this.#doorState) {
      case DoorState.OPENING:
        this.#doorState = DoorState.OPEN;
        this.#dwellRemaining = DOOR_DWELL_TICKS;
        this.#serveCurrentFloor();
        break;
      case DoorState.OPEN:
        if (this.#forceClose && !this.#holdOpen) {
          this.#doorState = DoorState.CLOSING;
          this.#forceClose = false;
          break;
        }
        if (this.#holdOpen) {
          break;
        }
        this.#dwellRemaining -= 1;
        if (this.#dwellRemaining <= 0) {
          this.#doorState = DoorState.CLOSING;
        }
        break;
      case DoorState.CLOSING:
        if (this.#holdOpen) {
          this.#doorState = DoorState.OPENING;
          break;
        }
        this.#doorState = DoorState.CLOSED;
        this.#forceClose = false;
        break;
      case DoorState.CLOSED:
        this.#advance();
        break;
      default:
        break;
    }
  }

  #beginOpening() {
    this.#doorState = DoorState.OPENING;
    this.#status = ElevatorStatus.LOADING;
  }

  #hasStopsAhead() {
    for (const floor of this.getCommittedFloors()) {
      if (this.#direction === Direction.UP && floor > this.#currentFloor) {
        return true;
      }
      if (this.#direction === Direction.DOWN && floor < this.#currentFloor) {
        return true;
      }
    }
    return false;
  }

  #hallAtCurrent() {
    return this.#hallCalls.get(this.#currentFloor);
  }

  #shouldStopHere() {
    if (this.#carFloors.has(this.#currentFloor)) {
      return true;
    }
    const hall = this.#hallAtCurrent();
    if (!hall || hall.size === 0) {
      return false;
    }
    if (this.#direction === Direction.IDLE) {
      return true;
    }
    if (hall.has(this.#direction)) {
      return true;
    }
    return !this.#hasStopsAhead();
  }

  #alignDirectionForStop() {
    const hall = this.#hallAtCurrent();

    if (this.#hasStopsAhead()) {
      return;
    }

    if (hall?.has(this.#direction)) {
      return;
    }

    if (hall?.has(Direction.UP) && !hall?.has(Direction.DOWN)) {
      this.#direction = Direction.UP;
      return;
    }
    if (hall?.has(Direction.DOWN) && !hall?.has(Direction.UP)) {
      this.#direction = Direction.DOWN;
      return;
    }
    if (hall?.size) {
      this.#direction =
        this.#direction === Direction.UP ? Direction.DOWN : Direction.UP;
      if (!hall.has(this.#direction)) {
        this.#direction = [...hall][0];
      }
    }
  }

  #serveCurrentFloor() {
    this.#alignDirectionForStop();
    this.#carFloors.delete(this.#currentFloor);

    const hall = this.#hallAtCurrent();
    if (!hall) {
      return;
    }

    if (this.#direction === Direction.UP || this.#direction === Direction.DOWN) {
      hall.delete(this.#direction);
    } else {
      hall.clear();
    }

    if (hall.size === 0) {
      this.#hallCalls.delete(this.#currentFloor);
    }
  }

  #nextTarget() {
    const floors = [...this.getCommittedFloors()];
    if (floors.length === 0) {
      return null;
    }

    if (this.#direction === Direction.UP) {
      const ahead = floors.filter((floor) => floor > this.#currentFloor);
      if (ahead.length) return Math.min(...ahead);
      if (floors.includes(this.#currentFloor)) return this.#currentFloor;
      const behind = floors.filter((floor) => floor < this.#currentFloor);
      if (behind.length) return Math.max(...behind);
      return null;
    }

    if (this.#direction === Direction.DOWN) {
      const ahead = floors.filter((floor) => floor < this.#currentFloor);
      if (ahead.length) return Math.max(...ahead);
      if (floors.includes(this.#currentFloor)) return this.#currentFloor;
      const behind = floors.filter((floor) => floor > this.#currentFloor);
      if (behind.length) return Math.min(...behind);
      return null;
    }

    if (floors.includes(this.#currentFloor)) {
      return this.#currentFloor;
    }

    return floors.sort(
      (a, b) =>
        Math.abs(a - this.#currentFloor) - Math.abs(b - this.#currentFloor)
    )[0];
  }

  #advance() {
    if (this.#shouldStopHere()) {
      this.#alignDirectionForStop();
      this.#beginOpening();
      return;
    }

    const target = this.#nextTarget();
    if (target == null) {
      this.#direction = Direction.IDLE;
      this.#status = ElevatorStatus.IDLE;
      return;
    }

    if (target === this.#currentFloor) {
      this.#alignDirectionForStop();
      this.#beginOpening();
      return;
    }

    this.#direction = target > this.#currentFloor ? Direction.UP : Direction.DOWN;
    this.#status = ElevatorStatus.MOVING;
    this.#currentFloor += this.#direction === Direction.UP ? 1 : -1;
  }

  toJSON() {
    const hallStops = {};
    const hallLights = {};
    for (const [floor, dirs] of this.#hallCalls) {
      hallStops[floor] = [...dirs];
      hallLights[floor] = {
        up: dirs.has(Direction.UP),
        down: dirs.has(Direction.DOWN),
      };
    }

    return {
      id: this.#id,
      currentFloor: this.#currentFloor,
      direction: this.#direction,
      doorState: this.#doorState,
      status: this.#status,
      carStops: [...this.#carFloors].sort((a, b) => a - b),
      hallStops,
      hallLights,
      holdOpen: this.#holdOpen,
    };
  }
}
