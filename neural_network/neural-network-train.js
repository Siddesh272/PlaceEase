const brain = require("brain.js");
const fs = require("fs").promises;
const path = require("path");

const network = new brain.NeuralNetwork({
  hiddenLayers: [70],
});

fs.readFile(path.join(__dirname, "data.json"))
  .then((raw_data) => {
    return JSON.parse(raw_data);
  })
  .then((data) => {
    // Use only the first 335 data points for training
    const trainingData = data.slice(0, 335).map((d) => {
      return {
        input: [
          d["engineering"],
          d["sslc"],
          d["plustwo"],
          d["ug"],
          d["pg"],
          d["project"],
          d["intern"],
          d["extras"],
          d["arrears"],
        ],
        output: [d["placed"]],
      };
    });

    return network.train(trainingData, {
      iterations: 20000,
      errorThresh: 0.00001,
      log: true,
      logPeriod: 10,
    });
  })
  .then(() => {
    console.log(network.toFunction().toString());
    return fs.writeFile(
      path.join(__dirname, "trained-model-dummy.js"),
      `module.exports=${network.toFunction().toString()};`
    );
  })
  .then(() => {
    console.log("finished");
  })
  .catch((err) => {
    console.log(err.message);
  });