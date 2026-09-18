import { Elevator } from "./Elevator.js";
import { HallRequest, CarRequest } from "./Request.js";
import { OpenDoorCommand, CloseDoorCommand } from "../commands/DoorCommand.js";
import {
  Direction,
  FLOOR_COUNT,
  INITIAL_FLOORS,
  MIN_FLOOR,
  MAX_FLOOR,
} from "../constants.js";

export class Building {
  #elevators;
  #events;
  #eventSeq;

  constructor() {
    this.floorCount = FLOOR_COUNT;
    this.#events = [];
    this.#eventSeq = 0;
    this.#elevators = INITIAL_FLOORS.map(
      (floor, index) => new Elevator(index + 1, floor)
    );
  }

  get elevators() {
    return this.#elevators;
  }

  hallCall(elevatorId, floor, direction) {
    this.#assertFloor(floor);
    if (direction !== Direction.UP && direction !== Direction.DOWN) {
      throw new Error("Hall call must be up or down");
    }
    if (floor === MIN_FLOOR && direction === Direction.DOWN) return;
    if (floor === MAX_FLOOR && direction === Direction.UP) return;

    const elevator = this.#requireElevator(elevatorId);
    if (elevator.hasHallCall(floor, direction)) {
      return;
    }

    const request = new HallRequest(floor, direction, elevator.id);
    request.fulfill(elevator);
    this.#log(
      `Car ${elevator.id} hall ${direction.toUpperCase()} at floor ${floor}`
    );
  }

  carCall(elevatorId, floor) {
    this.#assertFloor(floor);
    const elevator = this.#requireElevator(elevatorId);
    const request = new CarRequest(floor, elevatorId);
    request.fulfill(elevator);
    this.#log(`Elevator ${elevatorId} destination → floor ${floor}`);
  }

  doorCommand(elevatorId, floor, action) {
    this.#assertFloor(floor);
    const elevator = this.#requireElevator(elevatorId);
    const CommandClass =
      action === "open" ? OpenDoorCommand : CloseDoorCommand;
    const command = new CommandClass(elevator, floor);
    const ok = command.execute();
    if (ok) {
      this.#log(
        `Elevator ${elevatorId} door ${action} at floor ${floor}`
      );
    }
    return ok;
  }

  tick() {
    for (const elevator of this.#elevators) {
      elevator.tick();
    }
  }

  #requireElevator(id) {
    const elevator = this.#elevators.find((item) => item.id === Number(id));
    if (!elevator) {
      throw new Error(`Unknown elevator ${id}`);
    }
    return elevator;
  }

  #assertFloor(floor) {
    if (!Number.isInteger(floor) || floor < MIN_FLOOR || floor > MAX_FLOOR) {
      throw new Error(`Floor must be between ${MIN_FLOOR} and ${MAX_FLOOR}`);
    }
  }

  #log(message) {
    this.#eventSeq += 1;
    this.#events.unshift({
      id: this.#eventSeq,
      message,
      at: new Date().toISOString(),
    });
    this.#events = this.#events.slice(0, 24);
  }

  toJSON() {
    return {
      floorCount: this.floorCount,
      elevators: this.#elevators.map((elevator) => elevator.toJSON()),
      events: this.#events,
    };
  }
}
