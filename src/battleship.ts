// main function for training and testing the NN
// 1. generate training (and testing) states based on specified board and ship parameters
// 2. build NN model and set parameters
// 3. train NN model
// 4. test NN model and output
import { generateMatrix, generateTests, generateStrictTests, coord } from "./boardGenerator";
import { battleshipCost, battleshipStrictCost, initialiseNetwork } from "./network";
import { test, board } from "./GameData";
import { randomInt } from "crypto";
import { printMatrix } from "./formatter";
import { playBattleship } from "./testGames";
import { EMPTY } from "./probability";
const fs = require('fs');
var synaptic = require('synaptic');
var Trainer = synaptic.Trainer;
var Network = synaptic.Network;


let tests = JSON.parse(fs.readFileSync('./src/tests.json', { encoding: 'utf8', flag: 'r' }, (err) => {
    if (err)
      console.log(err);
    else {
      console.log("Tests file read successfully");
    }
}));
let testPairs = tests.testingPairs;
let network = Network.fromJSON(
    JSON.parse(fs.readFileSync('./NN.json', { encoding: 'utf8', flag: 'r' }, (err) => {
        if (err)
        console.log(err);
        else {
        console.log("NN file read successfully");
        }
    }))
);
console.log(network);
let trainer = new Trainer(network);

console.log(trainer.test(testPairs, 
    {
        iterations: 2000,
        error: 0.01,
        // cost: battleshipCost,
        shuffle: true,
    })
);
testDiagnostics(testPairs[0]);

let simulationShipState = {
    size: testPairs[1].size,
    matrix: testPairs[1].shipState
}
console.log('simulating game');
console.log(playBattleship(simulationShipState, NNApproach));

// console.log(network.trainer.train(strictTests, 
//     {
//         iterations: 2000,
//         error: 0.01,
//         cost: battleshipCost,
//         shuffle: true,
//     })
// );
// testDiagnostics(tests[0])

function NNApproach(hitState: board) {
    // convert board to single array
    let input: number[] = [];
    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            input.push(hitState.matrix[row][col]);
        }
    }
    let output = network.activate(input);
    let outputMatrix = convertToMatrix(output, hitState.size);
    let max = 0;
    let maxCoord: coord | undefined = undefined;

    for (let row = 0; row < hitState.size; row++) {
        for (let col = 0; col < hitState.size; col++) {
            if (outputMatrix[row][col] > max
                && hitState.matrix[row][col] === EMPTY) {
                maxCoord = {
                    row: row,
                    col: col
                };
                max = outputMatrix[row][col];
            }
        }
    }
    return maxCoord;
}

function testDiagnostics(test: test) {
    let testOutput = network.activate(test.input);
    console.log('Neural net output');
    let outputMatrix = convert1Darrayto2D(testOutput, test.size);
    console.log(outputMatrix)
    console.log('Expected output');
    let expectedMatrix = convert1Darrayto2D(test.output, test.size)
    console.log(expectedMatrix);
    console.log('hit State');
    console.log(test.hitState);
    console.log('probability State');
    console.log(test.probState);
    printMatrix(test.probState, test.size);
    console.log('ship State');
    console.log(test.shipState);
}

function convertToMatrix(input: number[], size: number) {
    let matrix: number[][] = [];
    let i = 0;
    for (let row = 0; row < size; row++) {
        matrix.push([]);
        for (let col = 0; col < size; col++) {
            matrix[row].push(input[i]);
            i++;
        }
    }
    return matrix;
}

function convert1Darrayto2D(input: number[], size: number) {
    let matrix: string[][] = [];
    let i = 0;
    for (let row = 0; row < size; row++) {
        matrix.push([]);
        for (let col = 0; col < size; col++) {
            matrix[row].push(input[i].toPrecision(4));
            i++;
        }
    }
    return matrix;
}