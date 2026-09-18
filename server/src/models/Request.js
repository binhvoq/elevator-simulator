import { Direction } from "../constants.js";

/**
 * Abstract passenger request.
 * HallRequest and CarRequest override matching / direction rules (polymorphism).
 */
export class Request {
  constructor(floor) {
    if (new.target === Request) {
      throw new Error("Request is abstract and cannot be instantiated directly");
    }
    this.floor = floor;
    this.createdAt = Date.now();
    this.assignedElevatorId = null;
  }

  getDirection() {
    throw new Error("getDirection() must be implemented by subclass");
  }

  /**
   * Whether this request can be picked up during the elevator's current trip.
   */
  isCompatibleWith(_elevator) {
    throw new Error("isCompatibleWith() must be implemented by subclass");
  }

  fulfill(_elevator) {
    throw new Error("fulfill() must be implemented by subclass");
  }
}

export class HallRequest extends Request {
  constructor(floor, direction, elevatorId) {
    super(floor);
    if (direction !== Direction.UP && direction !== Direction.DOWN) {
      throw new Error(`Invalid hall direction: ${direction}`);
    }
    this.direction = direction;
    this.elevatorId = Number(elevatorId);
    this.assignedElevatorId = this.elevatorId;
  }

  getDirection() {
    return this.direction;
  }

  isCompatibleWith(elevator) {
    return elevator.id === this.elevatorId;
  }

  fulfill(elevator) {
    if (!this.isCompatibleWith(elevator)) {
      throw new Error(`Hall call belongs to elevator ${this.elevatorId}`);
    }
    elevator.assignHallRequest(this);
  }

  toJSON() {
    return {
      type: "hall",
      floor: this.floor,
      direction: this.direction,
      assignedElevatorId: this.assignedElevatorId,
    };
  }
}

export class CarRequest extends Request {
  constructor(floor, elevatorId) {
    super(floor);
    this.elevatorId = elevatorId;
    this.assignedElevatorId = elevatorId;
  }

  getDirection() {
    return Direction.IDLE;
  }

  isCompatibleWith(elevator) {
    return elevator.id === this.elevatorId;
  }

  fulfill(elevator) {
    elevator.addCarRequest(this);
  }

  toJSON() {
    return {
      type: "car",
      floor: this.floor,
      elevatorId: this.elevatorId,
    };
  }
}
