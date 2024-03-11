const NeuralNetwork = require("../neural_network/trained-model.js");

// Calculate the sensitivity of the network output to each input
function calculateSensitivity(input, output) {
  const sensitivity = [];
  for (let i = 0; i < input.length; i++) {
    const sensitivityDelta = (output - NeuralNetwork(input.map((x, j) => i === j ? x + 0.01 : x))) / 0.01;
    sensitivity.push(sensitivityDelta);
  }
  return sensitivity;
}

// Identify the inputs with the highest sensitivity
function identifyHighestSensitivityInputs(sensitivity) {
  const highestSensitivityInputs = [];
  for (let i = 3; i < sensitivity.length; i++) {
    if (sensitivity[i] > 0) {
      highestSensitivityInputs.push(i);
    }
  }
  return highestSensitivityInputs;
}

// Recommend improving the inputs with the highest sensitivity
function recommendImprovements(highestSensitivityInputs) {
  const recommendations = [];
  for (const input of highestSensitivityInputs) {
    switch (input) {
      case 3:
        recommendations.push("Increase your UG score.");
        break;
      case 4:
        recommendations.push("Increase your PG score.");
        break;
      case 5:
        recommendations.push("Increase your project score.");
        break;
      case 6:
        recommendations.push("Increase your intern score.");
        break;
      case 7:
        recommendations.push("Increase your extra-curricular activities score.");
        break;
      case 8:
        recommendations.push("Decrease your number of kts.");
        break;
      default:
        recommendations.push("Unknown input.");
        break;
    }
  }
  return recommendations;
}

// Example usage:

const input = [1,1,0.84,0.71,1,0.83,1,1,0];
const output = NeuralNetwork(input);

// Display the predicted placement probability output
console.log("Predicted placement probability:", parseInt(output[0]*10000)/100);

const sensitivity = calculateSensitivity(input, output);
const highestSensitivityInputs = identifyHighestSensitivityInputs(sensitivity);
const recommendations = recommendImprovements(highestSensitivityInputs);

console.log("\nRecommendations:");
recommendations.forEach(recommendation => console.log(recommendation));
