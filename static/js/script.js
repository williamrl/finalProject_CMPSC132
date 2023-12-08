document.addEventListener('DOMContentLoaded', () => {
    const sudokuGrid = document.getElementById('sudoku-grid');
    const newGameButton = document.getElementById('new-game-btn');
    const validateButton = document.getElementById('validate-btn');
    const hintButton = document.getElementById('hint-btn');
    const messageBox = document.getElementById('message-box');
    let timer;
    let elapsedTime = 0;

    // Function to generate the Sudoku grid
    function generateGrid(puzzle) {
        sudokuGrid.innerHTML = '';
        puzzle.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.maxLength = 1; // Allow only single digit
                inputElement.classList.add('sudoku-cell');
                inputElement.value = cell > 0 ? cell : ''; // Fill cell if value is not 0
                inputElement.disabled = cell > 0; // Disable cell if it has a starting value
                inputElement.dataset.row = rowIndex;
                inputElement.dataset.col = colIndex;
                inputElement.addEventListener('input', handleCellInput);
                sudokuGrid.appendChild(inputElement);
            });
        });
    }

    // Handle input in Sudoku cells
    function handleCellInput(event) {
        const input = event.target;
        const value = input.value;
    
        // Validate input (ensure it's a single digit)
        if (!/^[1-9]$/.test(value)) {
            input.value = '';
        }
    
        // If the cell had an error, remove the highlighting once it's changed
        if (input.classList.contains('error')) {
            input.classList.remove('error');
        }
    }

    // Function to get a new Sudoku puzzle
    function getNewPuzzle() {
        fetch('/get-sudoku')
            .then(response => response.json())
            .then(puzzle => {
                generateGrid(puzzle);
                resetTimer();
                startTimer();
            });
    }
    function displayMessage(message) {
        const messageBox = document.getElementById('message-box');
        messageBox.textContent = message;
    }
    // Function to validate the Sudoku solution
    function validateSolution() {
        let grid = [];
        let isComplete = true;

        for (let i = 0; i < 9; i++) {
            let row = [];
            for (let j = 0; j < 9; j++) {
                let cell = document.querySelector(`.sudoku-cell[data-row="${i}"][data-col="${j}"]`);
                let value = cell.value ? parseInt(cell.value) : 0;
                row.push(value);
                if (value === 0) {
                    isComplete = false;
                }
            }
            grid.push(row);
        }

        if (isComplete) {
            fetch('/validate-sudoku', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ solution: grid }),
            })
            .then(response => response.json())
            .then(data => {
                clearHighlights();
                if (data.is_valid) {
                    displayMessage("Congratulations! You solved it!");
                    stopTimer();
                } else {
                    displayMessage("There are errors in your solution.");
                }
            });
        } else {
            displayMessage("The puzzle is not complete. Please fill in all cells.");
        }
    }
    
    function highlightErrors() {
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            if (!cell.disabled && cell.value) {
                cell.classList.add('error');
            }
        });
    }

    // Functionality for the hint button
    function provideHint() {
        let emptyCells = [];
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            if (!cell.value) {
                emptyCells.push(cell);
            }
        });
    
        if (emptyCells.length === 0) {
            displayMessage("No hints available");
            return;
        }
    
        let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        let validNumbers = findValidNumbersForCell(randomCell);
    
        if (validNumbers.length > 0) {
            randomCell.value = validNumbers[Math.floor(Math.random() * validNumbers.length)];
        } else {
            displayMessage("No valid hint available for this cell");
        }
    }
    
    function findValidNumbersForCell(cell) {
        let row = cell.dataset.row;
        let col = cell.dataset.col;
        let validNumbers = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    
        // Check the row and column
        document.querySelectorAll(`.sudoku-cell[data-row="${row}"]`).forEach(c => validNumbers.delete(c.value));
        document.querySelectorAll(`.sudoku-cell[data-col="${col}"]`).forEach(c => validNumbers.delete(c.value));
    
        // Check the 3x3 square
        let startRow = Math.floor(row / 3) * 3;
        let startCol = Math.floor(col / 3) * 3;
        for (let i = startRow; i < startRow + 3; i++) {
            for (let j = startCol; j < startCol + 3; j++) {
                let squareCell = document.querySelector(`.sudoku-cell[data-row="${i}"][data-col="${j}"]`);
                validNumbers.delete(squareCell.value);
            }
        }
    
        return Array.from(validNumbers);
    }
    

    // Timer functions
    function startTimer() {
        timer = setInterval(() => {
            elapsedTime++;
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timer);
    }

    function resetTimer() {
        stopTimer();
        elapsedTime = 0;
        document.getElementById('timer').textContent = '00:00';
    }

    // Event listeners for buttons
    newGameButton.addEventListener('click', getNewPuzzle);
    validateButton.addEventListener('click', validateSolution);
    hintButton.addEventListener('click', provideHint);

    // Initial call to load a new puzzle
    getNewPuzzle();
});
