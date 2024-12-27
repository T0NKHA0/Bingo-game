const socket = io();

let bingoBoard = [];
let markedNumbers = [];
const boardSize = 5;
let drawnHistory = [];
let currentNumber = null; // ตัวแปรเก็บหมายเลขที่ถูกสุ่มล่าสุด
let playerName = ''; // เก็บชื่อผู้เล่น

function generateBingoBoard() {
  const bingoBoardDiv = document.getElementById("bingo-board");
  bingoBoardDiv.innerHTML = "";

  // สุ่มตัวเลขจาก 1 ถึง 50 แล้วเลือก 25 ตัว
  const numbers = Array.from({ length: 50 }, (_, i) => i + 1); // สร้าง array ตัวเลข 1-50
  numbers.sort(() => Math.random() - 0.5); // สุ่มลำดับตัวเลข

  // เลือก 25 ตัวเลขแรกจาก 50 ตัวเลข
  const selectedNumbers = numbers.slice(0, 25);

  bingoBoard = [];
  markedNumbers = [];

  // จัดระเบียบตัวเลขให้เป็น 5x5 บนบอร์ด
  for (let i = 0; i < boardSize; i++) {
    bingoBoard.push(selectedNumbers.slice(i * boardSize, (i + 1) * boardSize));
  }

  // สร้างช่องในบอร์ด
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement("div");
      cell.classList.add("bingo-cell");
      cell.textContent = bingoBoard[i][j];
      cell.dataset.row = i;
      cell.dataset.col = j;

      // ทำให้ไม่สามารถคลิกตัวเลขที่ไม่ตรงกับตัวเลขที่ถูกสุ่ม
      cell.addEventListener("click", () => {
        if (parseInt(cell.textContent, 10) === currentNumber) {
          markNumber(i, j, cell);
        }
      });

      bingoBoardDiv.appendChild(cell);
    }
  }
}

function markNumber(row, col, cell) {
  const number = bingoBoard[row][col];

  if (!markedNumbers.includes(number)) {
    markedNumbers.push(number);
    cell.classList.add("marked");

    if (checkWin()) {
      socket.emit("playerWin");
    }
  }
}

function checkWin() {
  for (let i = 0; i < boardSize; i++) {
    if (bingoBoard[i].every((num) => markedNumbers.includes(num))) {
      return true;
    }
  }

  for (let j = 0; j < boardSize; j++) {
    if (bingoBoard.every((row) => markedNumbers.includes(row[j]))) {
      return true;
    }
  }

  if (bingoBoard.every((_, i) => markedNumbers.includes(bingoBoard[i][i]))) {
    return true;
  }

  if (bingoBoard.every((_, i) => markedNumbers.includes(bingoBoard[i][boardSize - 1 - i]))) {
    return true;
  }

  return false;
}

document.getElementById("start-game").addEventListener("click", () => {
  playerName = document.getElementById("player-name").value.trim();

  if (!playerName) {
    alert("Please enter your name to start the game.");
    return;
  }

  socket.emit("joinGame", { playerName });
  generateBingoBoard();
  document.getElementById("start-game").disabled = true;

  // ตรวจสอบว่าผู้เล่นที่มีชื่อ 6529011020 เท่านั้นที่สามารถกด Draw Number
  if (playerName === "6529011020") {
    document.getElementById("draw-number").disabled = false;
  } else {
    document.getElementById("draw-number").disabled = true;
  }
});

document.getElementById("draw-number").addEventListener("click", () => {
  socket.emit("drawNumber");
});

socket.on("newNumber", (number) => {
  currentNumber = number; // อัพเดตหมายเลขที่สุ่มล่าสุด
  document.getElementById("drawn-number").textContent = `Drawn Number: ${number}`;
  drawnHistory.push(number);

  const historyDiv = document.getElementById("drawn-history");
  historyDiv.textContent = `History: ${drawnHistory.join(", ")}`;

  const cells = document.querySelectorAll(".bingo-cell");
  cells.forEach((cell) => {
    if (parseInt(cell.textContent, 10) === number) {
      cell.classList.add("highlighted");
    } else {
      cell.classList.remove("highlighted"); // ลบไฮไลท์ออกจากตัวเลขที่ไม่ตรง
    }
  });
});

socket.on("announceWinner", (winnerName) => {
  document.getElementById("winner").textContent = `Winner: ${winnerName}`;
  alert(`${winnerName} wins!`);
  
  // Redirect to index page after 3 seconds
  setTimeout(() => {
    window.location.href = "/index.html";
  }, 3000);
});
