// generates various board states for testing
// need to be able to vary parameters and create multiple variations of the same underlying board state

import { board, ship } from "./GameData";

function generateSolutions(boardSize: number, ships: ship[]) {
    // generate
    // 1. ship configuration
    // 2. the correct result for the ship configuration
    // 3. different cases of available information (hits and misses)
}

// information cases
// varying levels of misses
// varying levels of hits
// combination of hits and misses

function generateShipConfiguration(boardSize: number, ships: ship[]) {
    let shipConfig: board;
    let shipsPlaced: boolean[] = [];
    for (const i in ships) {
        shipsPlaced.push(false);
    }


}