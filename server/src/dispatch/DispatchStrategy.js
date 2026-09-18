import { Direction, DoorState } from "../constants.js";

/**
 * Abstract dispatch strategy — different allocation policies can be swapped in.
 */
export class DispatchStrategy {
  choose(_elevators, _request) {
    throw new Error("choose() must be implemented by subclass");
  }
}

/**
 * Assigns the hall call to the elevator that can arrive soonest,
 * preferring cars already travelling in the same direction.
 */
export class DirectionalNearestStrategy extends DispatchStrategy {
  choose(elevators, request) {
    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const elevator of elevators) {
      const score = this.estimateTicks(elevator, request);
      if (score < bestScore) {
        bestScore = score;
        best = elevator;
      }
    }

    return best;
  }

  estimateTicks(elevator, request) {
    const pos = elevator.currentFloor;
    const dest = request.floor;
    const want = request.direction;
    const doorPenalty = elevator.doorState === DoorState.CLOSED ? 0 : 2;
    const stops = [...elevator.getCommittedFloors()];

    if (elevator.direction === Direction.IDLE) {
      return Math.abs(pos - dest) + doorPenalty;
    }

    if (elevator.direction === Direction.UP) {
      if (want === Direction.UP && dest >= pos) {
        return dest - pos + doorPenalty;
      }
      const highest = Math.max(pos, ...stops, dest);
      if (want === Direction.DOWN && dest <= highest) {
        return highest - pos + (highest - dest) + doorPenalty;
      }
      const lowest = Math.min(pos, dest, ...stops, 1);
      return highest - pos + (highest - lowest) + Math.abs(lowest - dest) + doorPenalty;
    }

    if (want === Direction.DOWN && dest <= pos) {
      return pos - dest + doorPenalty;
    }
    const lowest = Math.min(pos, ...stops, dest);
    if (want === Direction.UP && dest >= lowest) {
      return pos - lowest + (dest - lowest) + doorPenalty;
    }
    const highest = Math.max(pos, dest, ...stops, 10);
    return pos - lowest + (highest - lowest) + Math.abs(highest - dest) + doorPenalty;
  }
}
