import { board, ship } from "./GameData";
import { 
    inBounds,
    coord,
    generateMatrix,
    cloneBoard,
    directions
} from "./boardGenerator";
import { writeLine } from "./formatter";
// calculates a bayesian probability estimate of the board state.
// used to help train the neural network, and to compare against

const HIT = 1;
const EMPTY = 0.5;
const MISS = 0;

const NO_SHIP = 0;
const SHIP_PRESENT = 1;

let numArrangements: {
    accounted: number,
    listed: number,
} = {
    accounted: 0,
    listed: 0,
}
let numShipArrangements: {
    accounted: number,
    listed: number,
} = {
    accounted: 0,
    listed: 0,
};
let numArrangementsPerShip: {shipName: string, number: number}[] = [];


function independentProbability(hitState: board, ships: ship[]) {
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
                        //3x the weight
                        addProb(probBoard, ship, dir, coord);
                        addProb(probBoard, ship, dir, coord);
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

// calculates the probability of a given ship and a given arrangement / hitState
// the ship is free, meaning that it is placed independently of any ships that have not been fixed yet
function freeShip(hitState: board, arrangement: board, probBoard: board, fixedShips: ship[], ship: ship) {
    let localProb = {
        size: hitState.size,
        matrix: generateMatrix(hitState.size),
    };
    // all possible placements in free spaces
    // hits and misses are treated equally
    // ideally, most hits are already covered by fix methods
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            let coord = {row: row, col: col};
            for (const dir of directions) {
                if (arrangementPossible(hitState, arrangement, ship, dir, coord)) {
                    addProb(localProb, ship, dir, coord);
                }
            }
        }
    }

    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            probBoard[row][col] += localProb.matrix[row][col];
        }
    }
}

function probabilityToTarget(probBoard: board, hitState: board) {
    let max = 0;
    let target: coord | undefined = undefined;

    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            if (probBoard.matrix[row][col] > max
                && hitState.matrix[row][col] === EMPTY) {
                max = probBoard.matrix[row][col];
                target = {
                    row: row,
                    col: col
                }
            }
        }
    }

    if (target === undefined) {
        throw Error('could not find a possible target');
    } else {
        return target;
    }
}

function getBasicProbabilityTarget(hitState: board, ships: ship[]) {
    let probBoard = {
        size: hitState.size,
        matrix: independentProbability(hitState, ships),
    }
    return probabilityToTarget(probBoard, hitState);

}

function getImprovedProbabilityTarget(hitState: board, ships: ship[]) {
    // if there are less than 3 hits/misses, then use basic probability
    let numFired = 0;
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            if (hitState.matrix[row][col] !== EMPTY) {
                numFired++;
            }
        }
    }
    let probBoard: board;
    if (numFired < 0) {
        probBoard = {
            size: hitState.size,
            matrix: independentProbability(hitState, ships),
        };
    } else {
        probBoard = getImprovedProbabiliyBoard(hitState, ships);
    }
    return probabilityToTarget(probBoard, hitState);
}

function getImprovedProbabiliyBoard(hitState: board, ships: ship[]) {
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
    let timeStarted = Date.now();
    let numFired = 0;
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            if (hitState.matrix[row][col] !== EMPTY) {
                numFired++;
            }
        }
    }

    let modifiedShips: ship[] = [];
    const boardSize = hitState.size;
    let probBoard: board = {
        size: boardSize,
        matrix: generateMatrix(boardSize),
        breakdown: [],
    }
    numArrangementsPerShip = [];
    for (let ship of ships) {
        modifiedShips.push({
            placed: false,
            name: ship.name,
            length: ship.length,
        });
        probBoard.breakdown?.push({
            ship: ship,
            prob: {
                size: boardSize,
                matrix: generateMatrix(boardSize),
            },
        })
        numArrangementsPerShip.push({
            shipName: ship.name,
            number: 0,
        })
        ship.placed = false;
        // place will be synonymous with 'fixing'
    }
    const fixedShipsCopy: ship[] = JSON.parse(JSON.stringify(modifiedShips));
    // console.log(fixedShipsCopy);
    numArrangements = {
        accounted: 0,
        listed: 0,
    }
    shuffleArray(modifiedShips);
    for (let ship of modifiedShips) {
        // use recursion for each order of fitting ships into board state
        let blankArrangement: board = {
            size: boardSize,
            matrix: generateMatrix(boardSize),
        }
        numShipArrangements = {
            accounted: 0,
            listed: 0,
        };
        modifiedShips = JSON.parse(JSON.stringify(fixedShipsCopy));
        // console.log('starting arrangements with ship: ', ship);
        // console.log(modifiedShips);
        fixShip(hitState, blankArrangement, probBoard, modifiedShips, ship);
        // console.log(`${numShipArrangements.accounted} possibilities accounted for, ${numShipArrangements.listed} listed`);
        writeLine('timerByShip', `${numFired} ${numShipArrangements.listed} listed ${ship.name}`);
        writeLine('timerByShip', `${numFired} ${numShipArrangements.accounted} accounted ${ship.name}`);
    }

    for (let row = 0; row < probBoard.size; row++) {
        for (let col = 0; col < probBoard.size; col++) {
            if (hitState.matrix[row][col] == HIT) {
                probBoard.matrix[row][col] = -1;
            }
        }
    }
    for (const ship of numArrangementsPerShip) {
        // use recursion
        // let shipProb = findShipProb(ship, probBoard);
        // console.log(ship.name, 'probability board:\n', shipProb.matrix);
        writeLine('timerByShip', `${numFired} ${numShipArrangements.accounted} applied ${ship.shipName}`);
    }
    // console.log('total probability board\n', probBoard.matrix);
    // console.log(probBoard.matrix);
    
    writeLine('timerOverall', `${numFired} ${numArrangements.listed} listedTotal`);
    writeLine('timerOverall', `${numFired} ${numArrangements.accounted} accountedTotal`);
    writeLine('timerOverall', `${numFired} ${Date.now() - timeStarted} realTime`);
    return probBoard;
}

function permutationProbabilityCovering(hitState: board, ships: ship[]) {
    // Fix ship locations from known hits

}

function permutationProbabilitySampling(hitState: board, ships: ship[]) {
    // Generate random ship locations until it fits board state and covers at least one hit
    const boardSize = hitState.size;
    let probBoard: board = {
        size: boardSize,
        matrix: generateMatrix(boardSize),
        breakdown: [],
    }


}

function placeRandomShip(hitState: board, ships: ship[]) {
    
}

function fixShip(hitState: board, arrangement: board, probBoard: board, fixedShips: ship[], thisShip: ship) {
    if (thisShip.placed) {
        // console.log('ship already placed');
        return;
    }
    fixedShips = JSON.parse(JSON.stringify(fixedShips));
    for (let ship of fixedShips) {
        if (ship.name === thisShip.name && !ship.placed) {
            ship.placed = true;
        }
    }
    // console.log(fixedShips);
    const fixedShipsCopy = JSON.parse(JSON.stringify(fixedShips));
    // console.log('placing ship', thisShip);
    // console.log('copy is ', fixedShipsCopy);
    // console.log('orignal is ', fixedShips);
    const givenArrangement = cloneBoard(arrangement);
    // console.log(givenArrangement);
    let hitsToConsider: coord[] = [];
    let emptyToConsider: coord[] = [];
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            if (hitState.matrix[row][col] == HIT
                && givenArrangement.matrix[row][col] == NO_SHIP) {
                    hitsToConsider.push({row: row, col: col});
            }
            if (hitState.matrix[row][col] == EMPTY
                && givenArrangement.matrix[row][col] == NO_SHIP) {
                    emptyToConsider.push({row: row, col: col});
            }
        }
    }
    let possibleLocations: {coord: coord, dir: coord}[] = [];
    if (hitsToConsider.length !== 0) {
        for (const hit of hitsToConsider) {
            let hitArrangements = 
                getHitArrangements(hitState, givenArrangement, thisShip, hit);
            for (const loc of hitArrangements) {
                possibleLocations.push(loc);
            }
        }
        // console.log(possibleLocations);
    } else {
        for (const coord of emptyToConsider) {
            for (const dir of [{row: 1, col: 0}, {row: 0, col: 1}]) {
                possibleLocations.push({coord: coord, dir: dir});
            }
        }
    }
    shuffleArray(possibleLocations);
    let numLocTried = 0;
    numShipArrangements.listed += possibleLocations.length;
    numArrangements.listed += possibleLocations.length;
    for (const loc of possibleLocations) {
        numLocTried++;
        if (numArrangements.accounted > 12000 && numShipArrangements.accounted > 700) {
            return;
        } else if (numShipArrangements.accounted > 1500 - thisShip.length * 100) {
            if (numLocTried > 2) {
                return;
            }
        }
        let coord = loc.coord;
        let dir = loc.dir;
        // console.log('Trying ', coord, ' going ', dir);
        arrangement = cloneBoard(givenArrangement);
        let shipBoard = findShipProb(thisShip, probBoard);
        let shipArrangement = {
            size: shipBoard.size,
            matrix: generateMatrix(shipBoard.size),
        };
        if (arrangementPossible(hitState, arrangement, thisShip, dir, coord)) {
                let allShipsFixed = true;
                arrangement = cloneBoard(givenArrangement);
                addShipToArrangement(arrangement, thisShip, dir, coord);
                for (let ship of fixedShips) {
                    fixedShips = JSON.parse(JSON.stringify(fixedShipsCopy));
                    if (!ship.placed) {
                        // console.log('Fixed ship ', thisShip, 'subfixing ', ship);
                        allShipsFixed = false;
                        fixShip(hitState, arrangement, probBoard, fixedShips, ship);
                    }
                }
                if (allShipsFixed) {
                    numShipArrangements.accounted++;
                    numArrangements.accounted++;
                    addArrangementToProb(probBoard, arrangement);
                    addShipArrangementToCount(thisShip);
                    addShipToArrangement(shipBoard, thisShip, dir, coord);
                }
            }
    }
    /*
    if (hitsToConsider.length !== 0) {
        console.log(hitsToConsider);
        console.log(thisShip);
        // must cover at least one unaccounted hit
        for (const hit of hitsToConsider) {
            let hitArrangements = 
                getHitArrangements(hitState, givenArrangement, thisShip, hit);
            // console.log(hitArrangements);
            for (const hitArrangement of hitArrangements) {
                // TODO fix issue where it cannot find last ship when there are lots of hits           
                let allShipsFixed = true;
                let shipBoard = findShipProb(thisShip, probBoard);
                let shipArrangement = {
                    size: shipBoard.size,
                    matrix: generateMatrix(shipBoard.size),
                };
                console.log('given arrangement', givenArrangement.matrix);
                for (let ship of fixedShips) {
                    arrangement = cloneBoard(givenArrangement);
                    
                    addShipToArrangement(arrangement, thisShip, hitArrangement.dir, hitArrangement.coord);
                    addShipToArrangement(shipArrangement, thisShip, hitArrangement.dir, hitArrangement.coord);
                    fixedShips = JSON.parse(JSON.stringify(fixedShipsCopy));
                    if (!ship.placed) {
                        // console.log('Fixed ship ', thisShip, 'subfixing ', ship);
                        allShipsFixed = false;
                        fixShip(hitState, arrangement, probBoard, fixedShips, ship)
                    }
                }
                if (allShipsFixed) {
                    numFixes++;
                    numArrangements++;
                    addArrangementToProb(probBoard, arrangement);
                    addArrangementToProb(shipBoard, shipArrangement);
                }
            }
        }
        return;
    }
    // if all hits accounted for, then consider all remaining possibilities
    // TODO improve by getting list of coord, dir combinations on empty tiles
    // TODO iterate through list of coord, dir combos with common function (both for hit list, or for remaining list)
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            let coord = {row: row, col: col};

            // account for arrangements between known misses
            for (const dir of [{row: 1, col: 0}, {row: 0, col: 1}]) {
                // console.log('Trying ', coord, ' going ', dir);
                arrangement = cloneBoard(givenArrangement);
                console.log('given arrangement', givenArrangement.matrix);
                let shipBoard = findShipProb(thisShip, probBoard);
                let shipArrangement = {
                    size: shipBoard.size,
                    matrix: generateMatrix(shipBoard.size),
                };
                if (arrangementPossible(hitState, arrangement, thisShip, dir, coord)) {
                        let allShipsFixed = true;
                        for (let ship of fixedShips) {
                            arrangement = cloneBoard(givenArrangement);
                            addShipToArrangement(arrangement, thisShip, dir, coord);
                            addShipToArrangement(shipArrangement, thisShip, dir, coord);
                            fixedShips = JSON.parse(JSON.stringify(fixedShipsCopy));
                            if (!ship.placed) {
                                console.log('Fixed ship ', thisShip, 'subfixing ', ship);
                                console.log(fixedShips);
                                allShipsFixed = false;
                                fixShip(hitState, arrangement, probBoard, fixedShips, ship);
                            }
                        }
                        if (allShipsFixed) {
                            numFixes++;
                            numArrangements++;
                            addArrangementToProb(probBoard, arrangement);
                            addArrangementToProb(shipBoard, shipArrangement);
                        }
                    }
                }
        }
    }
    // console.log('returned');
    */
}

/**
 * Returns an array of all the possible arrangements the given ship could lie
 * that accounts for the hit at the given coordinate
 * All arrangements returned are valid placements
 */
function getHitArrangements(hitState: board, arrangement: board, ship: ship, coord: coord) {
    let arrangements: {coord: coord, dir: coord}[] = [];
    
    // horizontal arrangements
    const RIGHT = {
        row: 0,
        col: 1,
    }
    for (let i = -1 * ship.length + 1; i < ship.length - 1; i++) {
        let newCoord = {
            row: coord.row + RIGHT.row * i,
            col: coord.col + RIGHT.col * i
        };
        if (arrangementPossible(hitState, arrangement, ship, RIGHT, newCoord)) {
            arrangements.push({
                coord: newCoord,
                dir: RIGHT
            });
        }
    }
    // vertical arrangements
    const DOWN = {
        row: -1,
        col: 0,
    }
    for (let i = -1 * ship.length + 1; i < ship.length - 1; i++) {
        let newCoord = {
            row: coord.row + DOWN.row * i,
            col: coord.col + DOWN.col * i
        };
        if (arrangementPossible(hitState, arrangement, ship, DOWN, newCoord)) {
            arrangements.push({
                coord: newCoord,
                dir: DOWN
            });
        }
    }
    return arrangements;
}

function arrangementPossible(hitState: board, arrangement: board, ship: ship, dir: coord, coord: coord) {
    for (let i = 0; i < ship.length; i++) {
        let thisSquare = {
            row: coord.row + i * dir.row,
            col: coord.col + i * dir.col,
        };
        if (!inBounds(arrangement, thisSquare) ||
            arrangement.matrix[thisSquare.row][thisSquare.col] == SHIP_PRESENT
            || hitState.matrix[thisSquare.row][thisSquare.col] == MISS) {
            // ship cannot fit this way
            // console.log('overlap at ', thisSquare);
            return false;
        }
    }
    return true;
}

function addShipToArrangement(arrangement: board, ship: ship, dir: coord, coord: coord) {
    for (let i = 0; i < ship.length; i++) {
        let thisSquare = {
            row: coord.row + i * dir.row,
            col: coord.col + i * dir.col,
        };
        arrangement.matrix[thisSquare.row][thisSquare.col] += 1;
    }
}

function addArrangementToProb(probBoard: board, arrangement: board) {
    for (let row = 0; row < probBoard.size; row++) {
        for (let col = 0; col < probBoard.size; col++) {
            probBoard.matrix[row][col] += arrangement.matrix[row][col];
        }
    }
}

function findShipProb(ship: ship, board: board) {
    if (board.breakdown === undefined) {
        throw Error('board breakdown not initialised');
    }
    let shipBoard = board.breakdown.find(x => x.ship.name === ship.name);
    if (shipBoard !== undefined) {
        return shipBoard.prob;
    } else {
        throw Error('ship board not found')
    }
}

function addShipArrangementToCount(ship: ship) {
    for (let numArrShip of numArrangementsPerShip) {
        if (numArrShip.shipName === ship.name) {
            numArrShip.number++;
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

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
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
    independentProbability,
    getInfoGainBoard,
    getImprovedProbabilityTarget,
    getImprovedProbabiliyBoard,
    getBasicProbabilityTarget,
    HIT,
    MISS,
    EMPTY
}