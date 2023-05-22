// interface for game data, for easier use and readability

const hit = 1;
const miss = -1;

interface board {
    size: number;
    matrix: number[][];
}

type ship = number;

export {
    hit,
    miss,
    board,
    ship
}