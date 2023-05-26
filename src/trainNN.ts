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
const fs = require('fs');
var synaptic = require('synaptic');
var Trainer = synaptic.Trainer;
const NUMSHIPCONFIGURATIONS = 10;


const REGULAR_BATTLESHIP = {
    ships: [
        {
            length: 2,
            placed: false,
        },
        {
            length: 3,
            placed: false,
        },
        {
            length: 3,
            placed: false,
        },
        {
            length: 4,
            placed: false,
        },
        {
            length: 5,
            placed: false,
        },
    ],
    size: 10,
};

const MINI_BATTLESHIP = {
    ships: [
        {
            length: 2,
            placed: false,
        },
        {
            length: 3,
            placed: false,
        }
    ],
    size: 5,
};



let SIZE = 3;
let SHIPS = [
    {
        length: 2,
        placed: false,
    },
    {
        length: 2,
        placed: false,
    }
];

function setGame(game) {
    SIZE = game.size;
    SHIPS = game.ships;
    return game;
}

let game = setGame({
    size: 3,
    ships: [{
        length: 2,
        placed: false,
    }],
});
let trainingPairs = generateTests(SIZE, SHIPS, NUMSHIPCONFIGURATIONS);
let testingPairs = generateTests(SIZE, SHIPS, NUMSHIPCONFIGURATIONS);
let tests = {
    trainingPairs: trainingPairs,
    testingPairs: testingPairs,
    size: SIZE,
    ships: SHIPS,
}
fs.writeFile('./src/tests.json', JSON.stringify(tests), (err) => {
    if (err)
      console.log(err);
    else {
      console.log("Tests file written successfully");
    }
});

let network = initialiseNetwork(SIZE);

console.log(network.trainer.train(trainingPairs, 
    {
        iterations: 2000,
        error: 0.01,
        // cost: battleshipCost,
        shuffle: true,
    })
);
console.log(network.trainer.test(testingPairs, 
    {
        iterations: 2000,
        error: 0.01,
        // cost: battleshipCost,
        shuffle: true,
    })
);

let exportedNN = JSON.stringify(network.network.toJSON());
fs.writeFile('./NN.json', exportedNN, (err) => {
    if (err)
      console.log(err);
    else {
      console.log("NN file written successfully");
    }
});

function testDiagnostics(test: test) {
    let testOutput = network.network.activate(test.input);
    console.log('Neural net output');
    let outputMatrix = convert1Darrayto2D(testOutput, SIZE);
    console.log(outputMatrix)
    console.log('Expected output');
    let expectedMatrix = convert1Darrayto2D(test.output, SIZE)
    console.log(expectedMatrix);
    console.log('hit State');
    console.log(test.hitState);
    console.log('probability State');
    console.log(test.probState);
    printMatrix(test.probState, SIZE);
    console.log('ship State');
    console.log(test.shipState);
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