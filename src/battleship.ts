// main function for training and testing the NN
// 1. generate training (and testing) states based on specified board and ship parameters
// 2. build NN model and set parameters
// 3. train NN model
// 4. test NN model and output
import { generateTests } from "./boardGenerator";
import { battleshipCost, initialiseNetwork } from "./network";
var synaptic = require('synaptic');
var Trainer = synaptic.Trainer;
const SIZE = 3;
const SHIPS = [
    {
        length: 2,
        placed: false,
    }
];

let tests = generateTests(SIZE, SHIPS, 5000);
console.log('tests generated');
let network = initialiseNetwork(SIZE);
console.log(network.trainer.train(tests), 
    {
        cost: battleshipCost,
        shuffle: true,
        error: 0.001,
    }
);
let testOutput = network.network.activate(tests[0].input);
console.log(convert1Darrayto2D(testOutput, SIZE));
console.log(tests[0].inputBoard);
console.log(tests[0].outputBoard);

function convert1Darrayto2D(input: number[], size: number) {
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