// interface for game data, for easier use and readability

const HIT = 1;
const MISS = 0;
const EMPTY = 0.5;

const X = HIT;
const O = MISS;
const E = EMPTY;

interface board {
    size: number;
    matrix: number[][];
    breakdown?: {
        ship: ship;
        prob: board;
    }[];
}

interface ship {
    length: number;
    placed: boolean;
    name: string;
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


const REGULAR_BATTLESHIP = {
    ships: [
        {
            length: 2,
            placed: false,
            name: 'patrol_boat',
        },
        {
            length: 3,
            placed: false,
            name: 'submarine',
        },
        {
            length: 3,
            placed: false,
            name: 'destroyer',
        },
        {
            length: 4,
            placed: false,
            name: 'cruiser',
        },
        {
            length: 5,
            placed: false,
            name: 'aircraft_carrier',
        },
    ],
    size: 10,
};

const MINI_BATTLESHIP = {
    ships: [
        {
            length: 2,
            placed: false,
            name: 'patrol_boat',
        },
        {
            length: 3,
            placed: false,
            name: 'submarine',
        }
    ],
    size: 5,
};

const TINY_BATTLESHIP = {
    ships: [
        {
            length: 2,
            placed: false,
            name: 'patrol_boat',
        }
    ],
    size: 4,
};

const MINI_BATTLESHIP_2 = {
    ships: [
        {
            length: 2,
            placed: false,
            name: 'patrol_boat',
        },
        {
            length: 3,
            placed: false,
            name: 'submarine',
        },
        {
            length: 3,
            placed: false,
            name: 'destroyer',
        }
    ],
    size: 6,
};

export {
    HIT,
    MISS,
    EMPTY,
    X,
    O,
    E,
    board,
    ship,
    test,
    REGULAR_BATTLESHIP,
    MINI_BATTLESHIP,
    MINI_BATTLESHIP_2,
    TINY_BATTLESHIP
}