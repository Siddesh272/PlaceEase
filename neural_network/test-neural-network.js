const NeuralNetwork = require("../neural_network/trained-model.js");
const raw_data = require("./data.json");

const testData = raw_data.slice(335, 420); // Use data from index 336 to 419

let truePositives = 0;
let trueNegatives = 0;
let falsePositives = 0;
let falseNegatives = 0;

testData.forEach((d, i) => {
    const output = NeuralNetwork([
        d["engineering"],
        d["sslc"],
        d["plustwo"],
        d["ug"],
        d["pg"],
        d["project"],
        d["intern"],
        d["extras"],
        d["arrears"],
    ]);

    const predictedPlacement = parseInt(output[0] * 10000) / 100 < 75 ? 0 : 1;

    console.log(i + 336, d["placed"], predictedPlacement, parseFloat(output[0]).toFixed(2));

    if (d["placed"] === 1 && predictedPlacement === 1) {
        truePositives++;
    } else if (d["placed"] === 0 && predictedPlacement === 0) {
        trueNegatives++;
    } else if (d["placed"] === 0 && predictedPlacement === 1) {
        falsePositives++;
    } else {
        falseNegatives++;
    }
});

const total = testData.length;
const accuracy = ((truePositives + trueNegatives) / total) * 100;
const precision = (truePositives / (truePositives + falsePositives)) * 100;
const recall = (truePositives / (truePositives + falseNegatives)) * 100;
const f1Score = (2 * (precision * recall)) / (precision + recall);

console.log("\nTotal\t\t:\t" + total);
console.log("True Positives\t:\t" + truePositives);
console.log("True Negatives\t:\t" + trueNegatives);
console.log("False Positives\t:\t" + falsePositives);
console.log("False Negatives\t:\t" + falseNegatives);
console.log("Accuracy\t:\t" + accuracy.toFixed(2) + "%");
console.log("Precision\t:\t" + precision.toFixed(2) + "%");
console.log("Recall\t\t:\t" + recall.toFixed(2) + "%");
console.log("F1 Score\t:\t" + f1Score.toFixed(2));


// function test(inp)
// {
//   var out=NeuralNetwork(inp);
//   console.log(parseInt(out[0]*10000)/100);
// }


// test([0,0.5,0,0.6,1,0.2,0.5,0.6,0.8]);
