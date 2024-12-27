const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const playerNames = {}; // Store player names by socket ID
const drawnNumbers = new Set(); // Track drawn numbers

io.on("connection", (socket) => {
    console.log("A player connected:", socket.id);

    socket.on("joinGame", ({ playerName }) => {
        socket.join("game1");
        playerNames[socket.id] = playerName; // Save player name
        console.log(`${playerName} (${socket.id}) joined game: game1`);
        io.to("game1").emit("playerJoined", playerName);
    });

    socket.on("drawNumber", () => {
        let number;
        do {
            number = Math.floor(Math.random() * 50) + 1; // Draw number between 1 and 50
        } while (drawnNumbers.has(number));

        drawnNumbers.add(number);
        io.to("game1").emit("newNumber", number);
    });

    socket.on("playerWin", () => {
        console.log(`Player ${socket.id} wins in game game1`);
        const winnerName = playerNames[socket.id] || "Unknown Player";
        io.to("game1").emit("announceWinner", winnerName);
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete playerNames[socket.id]; // Clean up player name
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
