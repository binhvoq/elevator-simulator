/**
 * Command pattern for door controls (polymorphic execute()).
 */
export class DoorCommand {
  constructor(elevator, floor) {
    if (new.target === DoorCommand) {
      throw new Error("DoorCommand is abstract");
    }
    this.elevator = elevator;
    this.floor = floor;
  }

  canExecute() {
    return this.elevator.currentFloor === this.floor;
  }

  execute() {
    throw new Error("execute() must be implemented by subclass");
  }
}

export class OpenDoorCommand extends DoorCommand {
  execute() {
    if (!this.canExecute()) return false;
    this.elevator.openDoor();
    return true;
  }
}

export class CloseDoorCommand extends DoorCommand {
  execute() {
    if (!this.canExecute()) return false;
    this.elevator.closeDoor();
    return true;
  }
}
