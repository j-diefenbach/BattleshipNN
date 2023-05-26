import { board, ship, test } from "./GameData";
import { inBounds, coord, generateMatrix, directions } from "./boardGenerator";
// calculates a bayesian probability estimate of the board state.
// used to help train the neural network, and to compare against

const HIT = 1;
const EMPTY = 0.5;
const MISS = 0;

function getProbability(hitState: board, ships: ship[]) {
    let totalProb = generateMatrix(hitState.size);
    
    for (const ship of ships) {
        let probBoard = {
            size: hitState.size,
            matrix: generateMatrix(hitState.size),
        };
        // possible placements around misses
        for (let row = 0; row < hitState.size; row++) {
            for (let col = 0; col < hitState.size; col++) {
                let coord = {row: row, col: col};
                for (const dir of directions) {
                    if (!overlap(hitState, ship, dir, coord)) {
                        addProb(probBoard, ship, dir, coord);
                    }
                }
            }
        }

        // possible placements with hits
        for (let row = 0; row < hitState.size; row++) {
            for (let col = 0; col < hitState.size; col++) {
                let coord = {row: row, col: col};
                for (const dir of directions) {
                    if (hitState.matrix[row][col] == HIT && 
                        !overlap(hitState, ship, dir, coord)) {
                        addProb(probBoard, ship, dir, coord);
                    }
                }
            }
        }

        for (let row = 0; row < hitState.size; row++) {
            for (let col = 0; col < hitState.size; col++) {
                totalProb[row][col] += probBoard.matrix[row][col];
            }
        }
    }

    let max = 0;
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            if (totalProb[row][col] > max) {
                max += totalProb[row][col];
            }
        }
    }

    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            // transform to [0,1]
            totalProb[row][col] = totalProb[row][col] / max;
            if (isNaN(totalProb[row][col])) {
                totalProb[row][col] = 0;
            }
        }
    }
    return totalProb;
}

function getImprovedProbabiliy(hitState: board, ships: ship[]) {
    // for each ship
    // 1. fixes the ship in every possible arrangement
    // - if there are any hits that are not covered by current arrangement
    // - then the ship must be arranged to account for the hit
    // 2. repeat by fixing remaining ships
    // - this repeats for the current ship i.e. [1,2,3]
    // - start by fixing 1,
    // - then fix 2, then 3
    // - then fix 3, then 2
    // - then start w fixing 2 etc.

    let fixedShips = [...ships];
    for (let ship of fixedShips) {
        ship.placed = false;
        // place will be synonymous with 'fixing'
    }

    for (let ship of fixedShips) {
        // use recursion
    }
}

function fixShip(hitState: board, arrangement: board, fixedShips: ship[], ship: ship) {
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            
        }
    }
}


function getInfoGainBoard(hitState: board, probState: number[][], ships: ship[]) {
    // calculate info gain estimate for each unknown square
    
    let infoGain = generateMatrix(hitState.size);
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            if (hitState.matrix[row][col] == EMPTY) {
                infoGain[row][col] = 
                getInfoGainEstimate(hitState, {row: row, col: col},
                                    ships, probState[row][col]);
            } else {
                infoGain[row][col] = 0;
            }
        }
    }
    return infoGain;
}

/**
 * 
 * @param hitState current hit state
 * @param coord coordinate to calculate the info change for the two possible states (currently unknown)
 * @param ships ships for the game
 * @param pHit probability of a hit
 */
function getInfoGainEstimate(hitState: board, coord: coord, ships: ship[], pHit: number) {
    // calculates the current combinations in the board state
    // calculates the combinations in the board state after a HIT or MISS
    // at the given coord
    // this is then used in combination with pHit to generate an estimate of the info gained
    // by targeting that tile
    let currentInfo = getCombinations(hitState, ships);

    let hitAtCoord = {
        matrix: [...hitState.matrix],
        size: hitState.size
    };
    hitAtCoord.matrix[coord.row][coord.col] = HIT;
    let hitInfo = getCombinations(hitAtCoord, ships);

    let missAtCoord = {
        matrix: [...hitState.matrix],
        size: hitState.size
    };
    missAtCoord.matrix[coord.row][coord.col] = MISS;
    let missInfo = getCombinations(missAtCoord, ships);

    let infoGainedOnHit = currentInfo - hitInfo;
    let infoGainedOnMiss = currentInfo - missInfo;
    let infoGainEstimate = pHit * infoGainedOnHit + (1 - pHit) * infoGainedOnMiss;
    return infoGainEstimate;
}

function getCombinations(hitState: board, ships: ship[]) {
    let totalCombos = 0;
    
    for (const ship of ships) {
        // possible placements around misses
        for (let row = 0; row < hitState.size; row++) {
            for (let col = 0; col < hitState.size; col++) {
                let coord = {row: row, col: col};
                for (const dir of directions) {
                    if (!overlap(hitState, ship, dir, coord)) {
                        totalCombos++;
                    }
                }
            }
        }

        // possible placements with hits
        for (let row = 0; row < hitState.size; row++) {
            for (let col = 0; col < hitState.size; col++) {
                let coord = {row: row, col: col};
                for (const dir of directions) {
                    if (hitState.matrix[row][col] == HIT && 
                        !overlap(hitState, ship, dir, coord)) {
                            totalCombos++;
                    }
                }
            }
        }
    }
    return totalCombos;
}

/**
 * @returns true if there is an overlap, false otherwise
 */
function overlap(hitState: board, ship: ship, direction: coord, coord: coord) {
    for (let i = 0; i < ship.length; i++) {
        let thisSquare = {
            row: coord.row + i * direction.row,
            col: coord.col + i * direction.col,
        };
        if (!inBounds(hitState, thisSquare) ||
            hitState.matrix[thisSquare.row][thisSquare.col] == MISS) {
            // ship cannot fit this way
            // console.log(`Overlap at ${thisSquare.row}, ${thisSquare.col}`);
            return true;
        }
    }
    return false;
}

function addProb(probBoard: board, ship: ship, direction: coord, coord: coord) {
    for (let i = 0; i < ship.length; i++) {
        let thisSquare = {
            row: coord.row + i * direction.row,
            col: coord.col + i * direction.col,
        };
        probBoard.matrix[thisSquare.row][thisSquare.col] += 1;
    }
}

export {
    getProbability,
    getInfoGainBoard,
    HIT,
    MISS,
    EMPTY
}