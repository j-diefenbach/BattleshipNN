// given a function that maps an input hit state to a coordinate to target
// it simulates several battleship games and returns the turns to win
// (and maybe other stats in future)

import {
    board,
    ship,
    MINI_BATTLESHIP,
    REGULAR_BATTLESHIP,
    MINI_BATTLESHIP_2,
    TINY_BATTLESHIP,
    HIT,
    MISS,
    EMPTY,
    X,
    O,
    E
} from "./GameData";
import { generateMidMatrix, coord, generateShipConfiguration } from "./boardGenerator";
import {
    getBasicProbabilityTarget,
    getImprovedProbabilityTarget,
    getImprovedProbabiliyBoard,
} from './probability'
import {
    printEventLog,
    setDataSetName,
    writeLine
} from './formatter'
const NO_SHIP = 0;
const prompt = require('prompt-sync')();
const CUSTOM_GAME = {
    ships: [
        {
            length: 2,
            placed: false,
            name: 'patrol boat',
        },
        {
            length: 3,
            placed: false,
            name: 'sub',
        }
    ],
    size: 4,
};

const APPROACHES = {
    improvedProb: getImprovedProbabilityTarget,
    baiscProb: getBasicProbabilityTarget,
}

const GAME = REGULAR_BATTLESHIP;

const TEST_HITSTATE = {
    size: 4,
    matrix: [
        [E, E, O, X],
        [E, O, E, X],
        [E, E, O, X],
        [E, E, E, ]
    ]
}

// const inputTurns = prompt('Enter the number of turns to show: ');
// let numTurns = inputTurns as number;
console.log('Approaches: ', APPROACHES);
const inputApproach = prompt('Enter the name of the approach to simulate: ');
let approach: Function | undefined = undefined;
const inputDataSetName = prompt('Enter an identifiable name to add to the new data: ');
setDataSetName(inputDataSetName);
let turnLog = false;
if (inputApproach === 'improvedProb') {
    approach = APPROACHES.improvedProb
    turnLog = true;
} else if (inputApproach === 'baiscProb') {
    approach = APPROACHES.baiscProb
} else {
    approach = APPROACHES.baiscProb
}

const numGames = prompt('Enter the number of games to simulate: ') as number;

if (numGames === 0 || numGames <= 2000) {
    console.log(`simulating ${numGames} games..`);
    for (let i = 0; i < numGames; i++) {
        let simShipState: board = generateShipConfiguration(GAME.size, GAME.ships);
        simulateBattleship(simShipState, [...GAME.ships], approach);
    }
} else {
    console.log('simulating one game');
    let simShipState: board = generateShipConfiguration(GAME.size, GAME.ships);
    simulateBattleship(simShipState, [...GAME.ships], approach);
}



// simulates a battleship game given a ship state and an approach to use
// returns the number of turns to win the game
function playBattleship(shipState: board, approach: Function) {
    let hitState = {
        size: shipState.size,
        matrix: generateMidMatrix(shipState.size),
    };
    let i = 0;
    while(!gameWon(hitState, shipState, i)) {
        i++;
        if (i > shipState.size ** 2) {
            console.log('too many runs, quitting simulation game');
            return -1;
        }
        let target = approach(hitState);
        if (target === undefined) {
            continue;
        } else {
            if (shipState.matrix[target.row][target.col] !== NO_SHIP) {
                hitState.matrix[target.row][target.col] = HIT;
                printEventLog('test', 'hit', i);
            } else {
                hitState.matrix[target.row][target.col] = MISS;
                printEventLog('test', 'miss', i);
            }
        }
    }
    printEventLog('test', 'win', i);
    return i;
}

function simulateBattleship(shipState: board, ships: ship[], approach: Function) {
    // shows turn by turn views in the matrix of the function
    // function has to take in both hitState and ships
    let hitState = {
        size: shipState.size,
        matrix: generateMidMatrix(shipState.size),
    };
    if (shipState.breakdown !== undefined) {
        for (let ship of shipState.breakdown) {
            ship.ship = JSON.parse(JSON.stringify(ship.ship));
            ship.ship.placed = false;
        }
    }
    
    let i = 0;
    while(!gameWon(hitState, shipState, i)) {
        i++;
        if (i > shipState.size ** 2) {
            // console.log('too many runs, quitting simulation game');
            return -1;
        }
        try {
            let target = approach(hitState, ships);
            if (target === undefined) {
                console.log(shipState.matrix);
                showHits(hitState);
                console.log('couldnt find target!');
                return;
            } else {
                if (shipState.matrix[target.row][target.col] !== NO_SHIP) {
                    hitState.matrix[target.row][target.col] = HIT;
                    if (shipState.breakdown !== undefined) {
                        for (let shipBoard of shipState.breakdown) {
                                if (shipBoard.prob.matrix[target.row][target.col] !== NO_SHIP) {
                                    writeLine('game', `${i} hit ${shipBoard.ship.name}`);
                                }
                        }
                    } else {
                        writeLine('game', `${i} hit NA`);
                    }
                } else {
                    hitState.matrix[target.row][target.col] = MISS;
                    printEventLog('game', 'miss NA', i);
                }
            }
        } catch {
            try {
                let target = approach(hitState, ships);
                if (target === undefined) {
                    console.log(shipState.matrix);
                    showHits(hitState);
                    console.log('couldnt find target!');
                    return;
                } else {
                    if (shipState.matrix[target.row][target.col] !== NO_SHIP) {
                        hitState.matrix[target.row][target.col] = HIT;
                        if (shipState.breakdown !== undefined) {
                            for (let shipBoard of shipState.breakdown) {
                                    if (shipBoard.prob.matrix[target.row][target.col] !== NO_SHIP) {
                                        writeLine('game', `${i} hit ${shipBoard.ship.name}`);
                                    }
                            }
                        }
                    } else {
                        hitState.matrix[target.row][target.col] = MISS;
                        printEventLog('game', 'miss NA', i);
                    }
                }
            } catch {
                console.log(shipState.matrix);
                showHits(hitState);
                console.log('couldnt find target!');
                return;
            }
        }
        // showHits(hitState);
        if (turnLog) {
            // console.log(`turn ${i}`);
        }
    }
    printEventLog('game', 'win NA', i);
    console.log(`Game finished in ${i} turns`);
}

// using a given shipState, and a hitState, simulate a single turn of battleship
function singleTurn(shipState: board, hitState: board, ships: ship[], approach: Function) {
    let target = approach(hitState, ships);
    if (target === undefined) {
        console.log(shipState.matrix);
        showHits(hitState);
        console.log('couldnt find target!');
        return;
    } else {
        if (shipState.matrix[target.row][target.col] !== NO_SHIP) {
            hitState.matrix[target.row][target.col] = HIT;
        } else {
            hitState.matrix[target.row][target.col] = MISS;
        }
    }
        
    showHits(hitState);
}

// returns true/false if all ship tiles have been hit
// also checks if any ships have been sunk
function gameWon(hitState: board, shipState: board, turn: number) {
    if (shipState.breakdown !== undefined) {
        for (let shipBoard of shipState.breakdown) {
            if (!shipBoard.ship.placed) {
                // ship already sunk
                let shipSunk = true;
                for (let row = 0; row < hitState.size; row++) {
                    for (let col = 0; col < hitState.size; col++) {
                        if (shipBoard.prob.matrix[row][col] !== NO_SHIP) {
                            if (hitState.matrix[row][col] !== HIT) {
                                shipSunk = false;
                            }
                        }
                    }
                }
                if (shipSunk) {
                    shipBoard.ship.placed = true;
                    writeLine('game', `${turn} sunk ${shipBoard.ship.name}`);
                }
            }
        }
    }
    
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            if (shipState.matrix[row][col] !== NO_SHIP) {
                if (hitState.matrix[row][col] !== HIT) {
                    return false;
                }
            }
        }
    }
    return true;
}

function showHits(hitState: board) {
    let board = '';
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            if (hitState.matrix[row][col] == HIT) {
                board += 'X';
            } else if (hitState.matrix[row][col] == MISS) {
                board += 'O';
            } else {
                board += '-';
            }
        }
        board += '\n';
    }
    console.log(board);
}

export { playBattleship, simulateBattleship };