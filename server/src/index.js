import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { Simulator } from "./simulation/Simulator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");
const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const simulator = new Simulator();
simulator.onState((state) => io.emit("state", state));
simulator.start();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "elevator-simulator" });
});

app.get("/api/state", (_req, res) => {
  res.json(simulator.getState());
});

app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
    next();
    return;
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

io.on("connection", (socket) => {
  socket.emit("state", simulator.getState());

  socket.on("hallCall", ({ elevatorId, floor, direction } = {}) => {
    try {
      simulator.hallCall(elevatorId, floor, direction);
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

  socket.on("carCall", ({ elevatorId, floor } = {}) => {
    try {
      simulator.carCall(elevatorId, floor);
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

  socket.on("doorCommand", ({ elevatorId, floor, action } = {}) => {
    try {
      simulator.doorCommand(elevatorId, floor, action);
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

  socket.on("reset", () => simulator.reset());
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Elevator simulator running at http://localhost:${PORT}`);
});
