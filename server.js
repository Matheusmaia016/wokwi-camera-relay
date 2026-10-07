const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({
  server,
  path: "/camera"
});

app.use(express.static(path.join(__dirname, "public")));

let celular = null;
let esp32 = null;

wss.on("connection", (ws, req) => {

  console.log("Nova conexão");

  if (req.headers["user-agent"]?.includes("ESP32")) {
    esp32 = ws;
    console.log("ESP32 conectado");
  } else {
    celular = ws;
    console.log("Celular conectado");
  }

  ws.on("message", (data) => {

    // Celular → ESP32
    if (ws === celular && esp32) {

      if (esp32.readyState === WebSocket.OPEN) {
        esp32.send(data);
      }

    }

    // ESP32 → celular
    if (ws === esp32 && celular) {

      if (celular.readyState === WebSocket.OPEN) {
        celular.send(data);
      }

    }

  });

  ws.on("close", () => {

    if (ws === celular) {
      celular = null;
      console.log("Celular desconectado");
    }

    if (ws === esp32) {
      esp32 = null;
      console.log("ESP32 desconectado");
    }

  });

});

app.get("/status", (req, res) => {

  res.json({
    celular: celular !== null,
    esp32: esp32 !== null
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

  console.log(
    `Relay funcionando na porta ${PORT}`
  );

});