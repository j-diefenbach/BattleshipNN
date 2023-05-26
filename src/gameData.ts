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
    input: number[];
    output: number[];
    hitState: number[][];
    shipState: number[][];
    probState: number[][];
    infoGainState: number[][];
    size: number,
}

export {
    hit,
    miss,
    board,
    ship,
    test
}