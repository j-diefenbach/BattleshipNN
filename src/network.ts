var synaptic = require('synaptic'); // this line is not needed in the browser
var Neuron = synaptic.Neuron,
Layer = synaptic.Layer,
Network = synaptic.Network,
Trainer = synaptic.Trainer,
Architect = synaptic.Architect;

function initialiseNetwork(boardSize: number) {
    let layerSize = boardSize ** 2;
    var inputLayer = new Layer(layerSize);
    var hiddenLayer1 = new Layer(layerSize * 2);
    var outputLayer = new Layer(layerSize);

    inputLayer.project(hiddenLayer1);
    hiddenLayer1.project(outputLayer);

    var myNetwork = new Network({
        input: inputLayer,
        hidden: [hiddenLayer1],
        output: outputLayer
    });
    var trainer = new Trainer(myNetwork);

    console.log('network initialised with input/output size ', layerSize);
    return {
        network: myNetwork,
        trainer: trainer,
    }

}

function battleshipCost(target: number[], output: number[]) {
    let error = 0;
    for (let i in target) {
        if (target[i] == 1) {
            // should be a hit so dont square error
            error += (1 - output[i]) ** 2;
        } else {
            error += (target[i] - output[i]) ** 2;
        }
    }
    return error;
    
}

function battleshipStrictCost(target: number[], output: number[]) {
    let error = 0;
    for (let i in target) {
        if (target[i] == 1) {
            // should be a hit so dont square error
            error += (1 - output[i]);
        } else {
            error += (target[i]) ** 2;
        }
    }
    return error;
}

export { initialiseNetwork, battleshipCost, battleshipStrictCost };