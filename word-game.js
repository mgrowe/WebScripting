// Words the game can choose from. All words are 5 letters.
const WORDS = [
  "apple",
  "beach",
  "brain",
  "chair",
  "cloud",
  "dance",
  "earth",
  "flame",
  "grape",
  "heart",
  "light",
  "music",
  "plant",
  "river",
  "smile",
  "stone",
  "table",
  "train",
  "water",
  "world"
];

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

// Get the page elements the script needs to update.
const gridElement = document.getElementById("guess-grid");
const keyboardElement = document.getElementById("keyboard");
const messageElement = document.getElementById("message");
const restartButton = document.getElementById("restart-button");
const yearElement = document.getElementById("year");

yearElement.textContent = new Date().getFullYear();

// Store the game data in one object so it is easy to reset.
let game = createNewGame();

renderGrid();
renderKeyboard();
updateMessage("Type letters or use the keyboard below.");

// Listen for real keyboard presses.
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return;
  }

  handleInput(event.key);
});

// Listen for clicks on the on-screen keyboard.
keyboardElement.addEventListener("click", (event) => {
  if (!event.target.matches("button")) {
    return;
  }

  handleInput(event.target.dataset.key);
});

restartButton.addEventListener("click", () => {
  game = createNewGame();
  renderGrid();
  renderKeyboard();
  updateMessage("New game started. Guess the hidden word.");
});

// Create a fresh game object with a random hidden word.
function createNewGame() {
  return {
    hiddenWord: chooseRandomWord(),
    currentRow: 0,
    currentGuess: "",
    guesses: [],
    feedback: [],
    keyStatuses: {},
    isGameOver: false
  };
}

// Pick one word from the word list.
function chooseRandomWord() {
  const randomIndex = Math.floor(Math.random() * WORDS.length);
  return WORDS[randomIndex].toUpperCase();
}

// Send all keyboard input to the correct helper function.
function handleInput(key) {
  if (game.isGameOver) {
    return;
  }

  const pressedKey = key.toUpperCase();

  if (pressedKey === "BACKSPACE") {
    removeLetter();
  } else if (pressedKey === "ENTER") {
    submitGuess();
  } else if (/^[A-Z]$/.test(pressedKey)) {
    addLetter(pressedKey);
  }
}

// Add one letter to the current guess if there is room.
function addLetter(letter) {
  if (game.currentGuess.length >= WORD_LENGTH) {
    return;
  }

  game.currentGuess += letter;
  renderGrid();
}

// Remove the last letter from the current guess.
function removeLetter() {
  game.currentGuess = game.currentGuess.slice(0, -1);
  renderGrid();
}

// Submit the row only when the player has typed 5 letters.
function submitGuess() {
  if (game.currentGuess.length !== WORD_LENGTH) {
    updateMessage("Enter a 5-letter word before submitting.", "error");
    return;
  }

  const guess = game.currentGuess;
  const result = checkGuess(guess, game.hiddenWord);

  game.guesses.push(guess);
  game.feedback.push(result);
  updateKeyboardStatuses(guess, result);

  if (guess === game.hiddenWord) {
    game.isGameOver = true;
    updateMessage("You win! Great guessing.", "success");
  } else if (game.guesses.length === MAX_GUESSES) {
    game.isGameOver = true;
    updateMessage(`Game over. The word was ${game.hiddenWord}.`, "error");
  } else {
    game.currentRow += 1;
    game.currentGuess = "";
    updateMessage("Keep going.");
  }

  renderGrid();
  renderKeyboard();
}

// Compare the guess to the hidden word and return color feedback.
function checkGuess(guess, hiddenWord) {
  const result = Array(WORD_LENGTH).fill("absent");
  const hiddenLetters = hiddenWord.split("");

  // First pass: mark exact matches green.
  for (let i = 0; i < WORD_LENGTH; i += 1) {
    if (guess[i] === hiddenWord[i]) {
      result[i] = "correct";
      hiddenLetters[i] = null;
    }
  }

  // Second pass: mark correct letters in the wrong spot yellow.
  for (let i = 0; i < WORD_LENGTH; i += 1) {
    if (result[i] === "correct") {
      continue;
    }

    const matchingIndex = hiddenLetters.indexOf(guess[i]);

    if (matchingIndex !== -1) {
      result[i] = "present";
      hiddenLetters[matchingIndex] = null;
    }
  }

  return result;
}

// Track the strongest keyboard color for each letter.
// This keeps green from becoming yellow/gray, and yellow from becoming gray.
function updateKeyboardStatuses(guess, result) {
  const rank = {
    absent: 1,
    present: 2,
    correct: 3
  };

  for (let i = 0; i < WORD_LENGTH; i += 1) {
    const letter = guess[i];
    const newStatus = result[i];
    const oldStatus = game.keyStatuses[letter];

    if (!oldStatus || rank[newStatus] > rank[oldStatus]) {
      game.keyStatuses[letter] = newStatus;
    }
  }
}

// Render the 6x5 grid using the current game data.
function renderGrid() {
  gridElement.innerHTML = "";

  for (let row = 0; row < MAX_GUESSES; row += 1) {
    for (let col = 0; col < WORD_LENGTH; col += 1) {
      const tile = document.createElement("div");
      tile.className = "tile";

      const savedGuess = game.guesses[row];

      if (savedGuess) {
        tile.textContent = savedGuess[col];
        tile.classList.add(game.feedback[row][col]);
      } else if (row === game.currentRow) {
        tile.textContent = game.currentGuess[col] || "";
        tile.classList.toggle("filled", Boolean(game.currentGuess[col]));
      }

      gridElement.appendChild(tile);
    }
  }
}

// Render a simple clickable keyboard.
function renderKeyboard() {
  keyboardElement.innerHTML = "";

  KEYBOARD_ROWS.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "keyboard-row";

    if (row.startsWith("Z")) {
      rowElement.appendChild(createKey("Enter", "Enter", "wide"));
    }

    row.split("").forEach((letter) => {
      const keyStatus = game.keyStatuses[letter];
      rowElement.appendChild(createKey(letter, letter, keyStatus));
    });

    if (row.startsWith("Z")) {
      rowElement.appendChild(createKey("Backspace", "Backspace", "wide"));
    }

    keyboardElement.appendChild(rowElement);
  });
}

// Create one keyboard button.
function createKey(label, key, status = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.key = key;
  button.classList.add("key");

  if (status === "wide") {
    button.classList.add("wide");
  } else if (status) {
    button.classList.add(`key-${status}`);
  }

  button.disabled = game.isGameOver;
  return button;
}

// Update the message area and style.
function updateMessage(text, type = "") {
  messageElement.textContent = text;
  messageElement.className = type ? `message ${type}` : "message";
}
