// interface for game data, for easier use and readability

const hit = 1;
const miss = -1;

interface board {
    size: number;
    matrix: number[][];
}

interface ship {
    length: number;
    placed: boolean;
}

interface test {
    inputBoard: number[][];
    input: number[];
    output: number[];
    outputBoard: number[][];
}

export {
    hit,
    miss,
    board,
    ship,
    test
}