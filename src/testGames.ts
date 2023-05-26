// given a function that maps an input hit state to a coordinate to target
// it simulates several battleship games and returns the turns to win
// (and maybe other stats in future)

import { board } from "./GameData";
import { HIT, MISS, EMPTY } from "./probability";
import { generateMidMatrix, coord } from "./boardGenerator";
const NO_SHIP = 0;

// simulates a battleship game given a ship state and an approach to use
// returns the number of turns to win the game
function playBattleship(shipState: board, approach: Function) {
    let hitState = {
        size: shipState.size,
        matrix: generateMidMatrix(shipState.size),
    };
    let i = 0;
    while(!gameWon(hitState, shipState)) {
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
            } else {
                hitState.matrix[target.row][target.col] = MISS;
            }
        }
    }
    return i;
}

// returns true/false if all ship tiles have been hit
function gameWon(hitState: board, shipState: board) {
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

export { playBattleship };