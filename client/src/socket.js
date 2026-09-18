import { io } from "socket.io-client";

const socket = io({
  path: "/socket.io",
  transports: ["polling", "websocket"],
  reconnection: true,
});

export default socket;
