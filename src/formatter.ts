// formats data for exporting and visualisation in R

import { board } from "./GameData";

function printMatrix(matrix: number[][], size: number) {
    // row col value
    console.log('row col value');
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            console.log(`${row + 1} ${col + 1} ${matrix[row][col]}`);
        }
    }
}

export {
    printMatrix
};