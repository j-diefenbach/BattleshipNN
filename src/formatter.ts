// formats data for exporting and visualisation in R

import { board } from "./GameData";
const fs = require('fs');

function printMatrix(matrix: number[][], size: number) {
    // row col value
    console.log('row col value');
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            console.log(`${row + 1} ${col + 1} ${matrix[row][col]}`);
        }
    }
}

let dataSetName = 'blank';

function setDataSetName(newName) {
    dataSetName = newName;
}

function printEventLog(file: string, event: string, turn: number) {
    fs.appendFileSync(`./data/${file}.txt`, `${turn} ${event} ${dataSetName}\n`);
}

function writeLine(file: string, string: string) {
    fs.appendFileSync(`./data/${file}.txt`, `${string} ${dataSetName}\n`);
}

function printProbBoard(file: string, turn: number, board: board) {
    // TODO
    for (let row = 0; row < board.size; row++) {
        for (let col = 0; col < board.size; col++) {
            
        }
    }
}

export {
    printMatrix,
    printEventLog,
    writeLine,
    setDataSetName
};