from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

def generate_sudoku():
    base = 3
    side = base * base

    # pattern for a baseline valid solution
    def pattern(r, c): return (base * (r % base) + r // base + c) % side

    # randomize rows, columns and numbers (of valid base pattern)
    def shuffle(s): return random.sample(s, len(s))

    rBase = range(base)
    rows = [g * base + r for g in shuffle(rBase) for r in shuffle(rBase)]
    cols = [g * base + c for g in shuffle(rBase) for c in shuffle(rBase)]
    nums = shuffle(range(1, base * base + 1))

    # produce board using randomized baseline pattern
    board = [[nums[pattern(r, c)] for c in cols] for r in rows]

    squares = side * side
    empties = squares * 3 // 4
    for p in random.sample(range(squares), empties):
        board[p // side][p % side] = 0

    return board

def is_valid_sudoku(board):
    def valid_group(group):
        group = [x for x in group if x != 0]
        return len(group) == len(set(group))

    for i in range(9):
        row = [board[i][j] for j in range(9)]
        if not valid_group(row):
            return False

        col = [board[j][i] for j in range(9)]
        if not valid_group(col):
            return False

    for i in range(0, 9, 3):
        for j in range(0, 9, 3):
            square = [board[x][y] for x in range(i, i + 3) for y in range(j, j + 3)]
            if not valid_group(square):
                return False

    return True

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-sudoku', methods=['GET'])
def get_sudoku():
    puzzle = generate_sudoku()
    return jsonify(puzzle)

@app.route('/validate-sudoku', methods=['POST'])
def validate():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug print
        solution = data['solution']
        is_valid = is_valid_sudoku(solution)
        return jsonify({'is_valid': is_valid})
    except Exception as e:
        print("Error:", e)  # Debug print
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
