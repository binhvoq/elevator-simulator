import { Building } from "../models/Building.js";
import { TICK_MS } from "../constants.js";

export class Simulator {
  #building;
  #timer;
  #listeners;

  constructor() {
    this.#building = new Building();
    this.#timer = null;
    this.#listeners = new Set();
  }

  start() {
    if (this.#timer) return;
    this.#timer = setInterval(() => {
      this.#building.tick();
      this.#emit();
    }, TICK_MS);
  }

  stop() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  reset() {
    this.#building = new Building();
    this.#emit();
  }

  onState(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  getState() {
    return this.#building.toJSON();
  }

  hallCall(elevatorId, floor, direction) {
    this.#building.hallCall(Number(elevatorId), Number(floor), direction);
    this.#emit();
  }

  carCall(elevatorId, floor) {
    this.#building.carCall(Number(elevatorId), Number(floor));
    this.#emit();
  }

  doorCommand(elevatorId, floor, action) {
    this.#building.doorCommand(Number(elevatorId), Number(floor), action);
    this.#emit();
  }

  #emit() {
    const state = this.getState();
    for (const listener of this.#listeners) {
      listener(state);
    }
  }
}
