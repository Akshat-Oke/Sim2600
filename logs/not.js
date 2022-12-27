const fs = require('fs');
const byline = require('byline')
const readline = require('readline');
const transdefs = require('./transdefs.js');
// const dfd = require("danfojs-node")

function transistorsAreInSameBlock(t1, t2) {
  //t = ["name", w1, w2, w3, [x1, x2, y1, y2]]
  const BLOCK_SIZE = 500;
  const xblock1 = [Math.floor(t1[4][0] / BLOCK_SIZE), Math.floor(t1[4][1] / BLOCK_SIZE)]
  const yblock1 = [Math.floor(t1[4][2] / BLOCK_SIZE), Math.floor(t1[4][3] / BLOCK_SIZE)]

  const xblock2 = [Math.floor(t2[4][0] / BLOCK_SIZE), Math.floor(t2[4][1] / BLOCK_SIZE)]
  const yblock2 = [Math.floor(t2[4][2] / BLOCK_SIZE), Math.floor(t2[4][3] / BLOCK_SIZE)]
  //LOG ALL FOUR
  // console.log("xblock1", xblock1)
  // console.log("xblock2", xblock2)
  // console.log("yblock1", yblock1)
  // console.log("yblock2", yblock2)

  //match one element of xblock1 with one element of xblock2
  //and one element of yblock1 with one element of yblock2
  for (const xblock of xblock1) {
    if (xblock2.includes(xblock)) {
      for (const yblock of yblock1) {
        if (yblock2.includes(yblock)) {
          return true;
        }
      }
    }
  }
  return false;
}
Array.prototype.remove = function (element) {
  const index = this.indexOf(element);
  if (index > -1) {
    this.splice(index, 1);
  }
}
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length)
    return false;
  for (var i = arr1.length; i--;) {
    if (arr1[i] !== arr2[i])
      return false;
  }
  return true;
}
const VCC = 657,
  VSS = 558;
/**
 * @param {Array} t1 
 * @param {Array} t2 
 * @param {Array} t3 Must be the gate with VSS (ground) connection
 * @returns {Array|boolean} z wire index of the wires if it is a NAND gate, false otherwise
 *      VCC
 *      _|  = w1
 * ---||_
 *   t1  |___Z =  w2
 *      _|
 * A--||_
 *   t2  | = w3
 *      _|
 * B--||_
 *   t3  | =VSS
 *     __|__
 *      ___
 *       _
 *      VSS
 */
function isNandGate(t1, t2, t3) {
  // console.log("Checking if", t1, t2, t3, "is a NAND gate")
  let wt1 = t1.slice(2, 4),
    wt2 = t2.slice(2, 4),
    wt3 = t3.slice(2, 4);
  if (!wt3.includes(VSS)) {
    throw "t3 must be the gate with VSS (ground) connection"
  }
  if (wt1.includes(VSS) || wt2.includes(VSS)) {
    return false;
  }
  if (!wt1.includes(VCC) && !wt2.includes(VCC)) {
    return false;
  }
  /** @type {number[][]} */
  let transistorsInOrder;// = [t1, t2, t3];
  let origTransistorsInOrder;
  if (wt1.includes(VCC)) {
    transistorsInOrder = [wt1, wt2, wt3];
    origTransistorsInOrder = [t1, t2, t3];
  } else {
    transistorsInOrder = [wt2, wt1, wt3];
    origTransistorsInOrder = [t2, t1, t3];
  }
  // console.log("t = ", t)
  //w3 is the bottom wire but not VSS of t3
  transistorsInOrder[2].remove(VSS);
  transistorsInOrder[0].remove(VCC);
  let z = transistorsInOrder[0][0];
  let w3 = transistorsInOrder[2][0];
  if (arraysEqual([z, w3].sort(), transistorsInOrder[1].sort())) {
    return { z, transistorsInOrder: origTransistorsInOrder };
  }
  return false;
}

function isNotGate(t1, t2) {
  let wt1 = t1.slice(2, 4),
    wt2 = t2.slice(2, 4);
  if (!wt2.includes(VSS)) {
    throw "t2 must be the gate with VSS (ground) connection"
  }
  if (wt1.includes(VSS)) {
    return false;
  }
  if (!wt1.includes(VCC)) {
    return false;
  }
  wt1.remove(VCC);
  wt2.remove(VSS);
  let z = wt1[0];
  let w3 = wt2[0];
  if (z == w3) {
    return { z, transistorsInOrder: [t1, t2] };
  }
  return false;
}

//nv = net connection
//gate = gate connection
function getCandidates(gateFunc) {
  let candidates = [];
  let grounded = transdefs.filter(t => t.includes(VSS));
  let vcced = transdefs.filter(t => t.includes(VCC));
  for (const t1 of vcced) {
    for (const t2 of grounded) {
      if (transistorsAreInSameBlock(t1, t2) && t2.includes(VSS)) {
        let val = gateFunc(t1, t2);
        if (val) {
          candidates.push({
            transistorsInOrder: val.transistorsInOrder,
            outputWireIndex: val.z
          });
        }
      }
    }
  }
  return candidates;
}

const gateFunc = {
  "NAND": (a, b) => !(a && b),
  "AND": (a, b) => a && b,
  "OR": (a, b) => a || b,
  "NOR": (a, b) => !(a || b),
  "XOR": (a, b) => a ^ b,
  "XNOR": (a, b) => !(a ^ b),
  "NOT": (a) => !a,
}

const verifiedGates = [];

function checkIfWiresFormGate({ gateType, in1, in2, out, elementToAdd }) {
  var stream = byline(fs.createReadStream('wire.txt', { encoding: 'utf8' }));
  let valid = true;
  let lineCount = 0;
  stream.on('data', function (line) {
    const wires = line.split(",").map(Number);
    lineCount++;
    if (wires[out] != gateFunc[gateType](wires[in1], wires[in2])) {
      // console.log("Failed at line", lineCount, "for", wires[in1], wires[in2], "wire values, got: ", wires[out])
      valid = false;
      stream.end();
    }
  }).on('end', function () {
    // fs.writeFile("found.txt", JSON.stringify(elementToAdd), function (err) {
    //   if (err) {
    //     return console.log(err);
    //   }
    //   console.log("The file was saved!");
    // });
    if (valid) {
      verifiedGates.push({ type: gateType, g: elementToAdd });
      console.log("Adding", elementToAdd)
      fs.appendFileSync("not_gates_verified.txt", elementToAdd.transistorsInOrder[0][0] + ", " +
        elementToAdd.transistorsInOrder[1][0] + "\n");
    } else {
      // console.log("Failed for", elementToAdd)
    }
  });
}
/**
 * Verify if given wires follow the gate 
 * truth table
 * @param {string} gateType AND/NOT etc
 */

(async function () {
  let nandGates = getCandidates(isNotGate);
  let g = 0;
  for (const gate of nandGates) {
    g++;
    const transistors = gate.transistorsInOrder;
    const t2 = transistors[1];
    const in1 = t2[1];
    // const t3 = transistors[2];
    // const in2 = t3[1];
    const out = gate.outputWireIndex;
    // console.log("For gate", gate, "check if wires", in1, out, " form NAND gate")
    // fs.appendFileSync('not_gates1.txt', gate.transistorsInOrder[0][0] + ", " +
    //   gate.transistorsInOrder[1][0] + `: ${in1}->${out} \n`
    // );
    checkIfWiresFormGate({ gateType: "NOT", in1, in2: in1, out, elementToAdd: gate });
  }
  console.log("Total gates", g)
})()

// checkIfWiresFormGate({
//   gateType: "NOT",
//   in1: 869,
//   in2: 869,
//   out: 349,
//   elementToAdd: "k"
// })