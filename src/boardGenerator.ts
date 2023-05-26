// generates various board states for testing
// need to be able to vary parameters and create multiple variations of the same underlying board state

import { board, ship, test } from "./GameData";
import { getInfoGainBoard, getProbability } from "./probability";

function generateTests(boardSize: number, ships: ship[], numSolutions: number) {
    let tests: test[] = [];
    let numTrainingPairs = 0;
    for (let i = 0; i < numSolutions; i++) {
        let shipConfig = generateShipConfiguration(boardSize, ships);
        let hitConfigs = generateHitConfigurations(shipConfig);
        for (const hitConfig of hitConfigs) {
            // generate input-solution pair
            let probState = getProbability(hitConfig, ships);
            let infoGainState = getInfoGainBoard(hitConfig, probState, ships);
            let newTest: test = {
                input: [],
                output: [],
                hitState: hitConfig.matrix,
                shipState: shipConfig.matrix,
                probState: probState,
                infoGainState: infoGainState,
                size: boardSize,
            }
            for (let row = 0; row < boardSize; row++) {
                for (let col = 0; col < boardSize; col++) {
                    newTest.input.push(hitConfig.matrix[row][col]);
                    newTest.output.push(infoGainState[row][col]);
                }
            }
            tests.push(newTest)
            numTrainingPairs++;
        }
    }
    console.log(`${numSolutions} ship states generated, ${numTrainingPairs} input/output pairs generated`);
    return tests;
}

function generateStrictTests(boardSize: number, ships: ship[], numSolutions: number) {
    let tests: test[] = [];
    let numTrainingPairs = 0;
    for (let i = 0; i < numSolutions; i++) {
        let shipConfig = generateShipConfiguration(boardSize, ships);
        let hitConfigs = generateHitConfigurations(shipConfig);
        for (const hitConfig of hitConfigs) {
            // generate input-solution pair
            let probState = getProbability(hitConfig, ships);
            let solution = shipConfig.matrix;
            let infoGainState = getInfoGainBoard(hitConfig, probState, ships);
            let newTest: test = {
                input: [],
                output: [],
                hitState: hitConfig.matrix,
                shipState: shipConfig.matrix,
                probState: probState,
                infoGainState: infoGainState,
                size: boardSize,
            }
            for (let row = 0; row < boardSize; row++) {
                for (let col = 0; col < boardSize; col++) {
                    newTest.input.push(hitConfig.matrix[row][col]);
                    newTest.output.push(solution[row][col]);
                }
            }
            tests.push(newTest)
            numTrainingPairs++;
        }
    }
    console.log(`${numSolutions} ship states generated, ${numTrainingPairs} input/output pairs generated`);
    return tests;
}

// information cases
// varying levels of misses
// varying levels of hits
// combination of hits and misses



const EMPTY = 0;
interface coord {
    row: number;
    col: number;
}

const UP: coord = {row: -1, col: 0};
const DOWN: coord = {row: 1, col: 0};
const LEFT: coord = {row: 0, col: -1};
const RIGHT: coord = {row: 0, col: 1};
const directions = [UP, DOWN, LEFT, RIGHT];

const MAXTRIES = 100;

// SHIP HELPERS

function generateShipConfiguration(boardSize: number, ships: ship[]) {
    for (let ship of ships) {
        ship.placed = false;
    }
    let shipConfig: board = {
        size: boardSize,
        matrix: generateMatrix(boardSize),
    };
    
    let allShipsPlaced = false;
    while (ships.find(x => !x.placed) !== undefined) {
        tryPlaceShip(shipConfig, ships[getRandomInt(ships.length)]);
    }
    return shipConfig;
}

function tryPlaceShip(shipConfig: board, ship: ship) {
    // pick a random ship
    // pick a random direction
    // pick a random possible coordinate
    // check for overlap
    // place
    if (ship.placed) {
        return;
    }
    let tries = 0;
    while (tries < MAXTRIES) {
        let direction = directions[getRandomInt(directions.length)];
        let coord = getRandomCoord(shipConfig.size);
        // console.log(coord);
        // console.log(direction);
        if (!overlap(shipConfig, ship, direction, coord)) {
            place(shipConfig, ship, direction, coord);
            ship.placed = true;
            break;
        }
        tries++;
    }
    if (tries > MAXTRIES) {
        console.log(`${tries} TRIES REACHED`);
        throw Error('too many tries to place ship');
    }
}
/**
 * @returns true if there is an overlap, false otherwise
 */
function overlap(board: board, ship: ship, direction: coord, coord: coord) {
    for (let i = 0; i < ship.length; i++) {
        let thisSquare = {
            row: coord.row + i * direction.row,
            col: coord.col + i * direction.col,
        };
        if (!inBounds(board, thisSquare) ||
            board.matrix[thisSquare.row][thisSquare.col] != EMPTY) {
            // console.log(`Overlap at ${thisSquare.row}, ${thisSquare.col}`);
            return true;
        }
    }
    return false;
}

function place(board: board, ship: ship, direction: coord, coord: coord) {
    for (let i = 0; i < ship.length; i++) {
        let thisSquare = {
            row: coord.row + i * direction.row,
            col: coord.col + i * direction.col,
        };
        board.matrix[thisSquare.row][thisSquare.col] = 1;
    }
}

// HIT STATE HELPERS

function generateHitConfigurations(board: board): board[] {
    let configurations: board[] = [];
    for (let i = 0; i < 5; i++) {
        configurations.push(
            generateRandom(board, getRandomInt(board.size * board.size)));
        configurations.push(
            generateHitsOnly(board, getRandomInt(board.size * board.size)));
        configurations.push(
            generateMissesOnly(board, getRandomInt(board.size * board.size)));
    }
    configurations.push(generateDetermined(board));
    configurations.push(generateDetermined(board));
    return configurations;
}

function generateRandom(board: board, numHits: number) {
    let hitBoard = {
        size: board.size,
        matrix: generateMidMatrix(board.size),
    }
    if (numHits > board.size * board.size) {
        numHits = board.size * board.size;
    } else if (numHits < 0) {
        numHits = 0;
    }
    for (let i = 0; i < numHits; i++) {
        while (1) {
            let coord = getRandomCoord(board.size);
            let square = board.matrix[coord.row][coord.col];
            if (hitBoard.matrix[coord.row][coord.col] == 0.5) {
                if (square == 1) {
                    hitBoard.matrix[coord.row][coord.col] = 1;
                } else {
                    hitBoard.matrix[coord.row][coord.col] = 0;
                }
                break;
            }
        }
    }
    return hitBoard;
}

// generates a board that is fully determined (completely full)
function generateDetermined(board: board) {
    let hitBoard = {
        size: board.size,
        matrix: generateMidMatrix(board.size),
    }
    for (let row = 0; row < board.size; row++) {
        for (let col = 0; col < board.size; col++) {
            let square = board.matrix[row][col];
            if (hitBoard.matrix[row][col] == 0.5) {
                if (square == 1) {
                    hitBoard.matrix[row][col] = 1;
                } else {
                    hitBoard.matrix[row][col] = 0;
                }
                break;
            }
        }
    }
    return hitBoard;
}

function generateMissesOnly(board: board, numHits: number) {
    let hitBoard = {
        size: board.size,
        matrix: generateMidMatrix(board.size),
    }
    if (numHits > board.size * board.size) {
        numHits = board.size * board.size;
    } else if (numHits < 0) {
        numHits = 0;
    }
    for (let i = 0; i < numHits; i++) {
        while (1) {
            let coord = getRandomCoord(board.size);
            let square = board.matrix[coord.row][coord.col];
            if (hitBoard.matrix[coord.row][coord.col] == 0.5) {
                if (square == 1) {
                    break;
                } else {
                    hitBoard.matrix[coord.row][coord.col] = 0;
                }
                break;
            }
        }
    }
    return hitBoard;
}

function generateHitsOnly(board: board, numHits: number) {
    let hitBoard = {
        size: board.size,
        matrix: generateMidMatrix(board.size),
    }
    if (numHits > board.size * board.size) {
        numHits = board.size * board.size;
    } else if (numHits < 0) {
        numHits = 0;
    }
    for (let i = 0; i < numHits; i++) {
        while (1) {
            let coord = getRandomCoord(board.size);
            let square = board.matrix[coord.row][coord.col];
            if (hitBoard.matrix[coord.row][coord.col] == 0.5) {
                if (square == 1) {
                    hitBoard.matrix[coord.row][coord.col] = 1;
                } else {
                    break;
                }
                break;
            }
        }
    }
    return hitBoard;
}

// SOLTUION HELPERS

function generateSolution(shipConfig: number[][], hitConfig: number[][], probState: number[][], size: number) {
    // generates the desired solution from the NN, helps guide development based on strictness or expectations

    let solution = generateMatrix(size);
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (hitConfig[row][col] == 1 || shipConfig[row][col] == 1) {
                solution[row][col] = 1;
            } else {
                // probability for guided learning
                solution[row][col] = probState[row][col];
            }
        }

    }
    return solution;
}

// SIMPLE HELPERS

function generateMatrix(size: number) {
    let matrix: number[][] = [];
    for (let row = 0; row < size; row++) {
        matrix.push([]);
        for (let col = 0; col < size; col++) {
            matrix[row].push(0);
        }
    }
    return matrix;
}

function generateMidMatrix(size: number) {
    let matrix: number[][] = [];
    for (let row = 0; row < size; row++) {
        matrix.push([]);
        for (let col = 0; col < size; col++) {
            matrix[row].push(0.5);
        }
    }
    return matrix;
}

function inBounds(board: board, coord: coord) {
    if (coord.row < 0 || coord.row >= board.size) {
        return false;
    } else if (coord.col < 0 || coord.col >= board.size) {
        return false;
    } else {
        return true;
    }
}

function getRandomCoord(size: number): coord {
    return {
        row: getRandomInt(size),
        col: getRandomInt(size),
    }
}

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

export {
    generateTests,
    generateStrictTests,
    generateShipConfiguration,
    inBounds,
    coord,
    directions,
    EMPTY,
    generateMatrix,
    generateMidMatrix
}