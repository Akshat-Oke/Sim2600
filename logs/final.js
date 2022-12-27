const fs = require('fs');
const byline = require('byline')
const readline = require('readline');
const transdefs = require('./transdefs.js');
// const dfd = require("danfojs-node")

function transistorsAreInSameBlock(t1, t2) {
  //t = ["name", w1, w2, w3, [x1, x2, y1, y2]]
  const xblock1 = [Math.floor(t1[4][0] / 300), Math.floor(t1[4][1] / 300)]
  const yblock1 = [Math.floor(t1[4][2] / 300), Math.floor(t1[4][3] / 300)]

  const xblock2 = [Math.floor(t2[4][0] / 300), Math.floor(t2[4][1] / 300)]
  const yblock2 = [Math.floor(t2[4][2] / 300), Math.floor(t2[4][3] / 300)]
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

//nv = net connection
//gate = gate connection
function getCandidates(gateFunc) {
  let candidates = [];
  let grounded = transdefs.filter(t => t.includes(VSS));
  for (const t1 of transdefs) {
    for (const t2 of transdefs) {
      if (transistorsAreInSameBlock(t1, t2)) {
        for (const t3 of grounded) {
          //check if all three are in the same block
          if (transistorsAreInSameBlock(t1, t2) && transistorsAreInSameBlock(t2, t3)) {
            let val = gateFunc(t1, t2, t3);
            if (val) {
              candidates.push({
                transistorsInOrder: val.transistorsInOrder,
                outputWireIndex: val.z
              });
            }
          }
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
      console.log("Failed at line", lineCount, "for", wires[in1], wires[in2], "wire values, got: ", wires[out])
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
    }
  });
  // console.log("Yeah")
}
/**
 * Verify if given wires follow the gate 
 * truth table
 * @param {string} gateType AND/NOT etc
 */
async function checkIfWiresFormGate1({ gateType, in1, in2, out, elementToAdd }) {
  const fileStream = fs.createReadStream('wire.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  // console.log("Hello")

  let valid = true;
  let lineCount = 0;
  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    const wires = line.split(",").map(Number);
    lineCount++;
    if (wires[out] != gateFunc[gateType](wires[in1], wires[in2])) {
      // console.log("Failed at line", lineCount, "for", wires[in1], wires[in2], "wire values, got: ", wires[out])
      valid = false;
      break;
    } else {
      // console.log("Hello")
    }
  }
  if (valid) {
    fs.writeFile("found.txt", JSON.stringify(elementToAdd), function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });
    console.log("Adding", elementToAdd)
  }
}

(async function () {
  let nandGates = getCandidates(isNandGate);
  let g = 0;
  for (const gate of nandGates) {
    g++;
    const transistors = gate.transistorsInOrder;
    const t2 = transistors[1];
    const in1 = t2[1];
    const t3 = transistors[2];
    const in2 = t3[1];
    const out = gate.outputWireIndex;
    console.log("For gate", gate, "check if wires", in1, in2, out, " form NAND gate")
    // checkIfWiresFormGate("NAND", in1, in2, out, gate);
    // checkIfWiresFormGate({
    //   gateType: "NAND",
    //   in1,
    //   in2,
    //   out,
    //   elementToAdd: gate
    // })
  }
  console.log("Total gates", g)
})()
// checkIfWiresFormGate({
//   gateType: "NOT",
//   in1: 1608,
//   in2: 869,
//   out: 349,
//   elementToAdd: "asd"
// })

/** @type {{[x: string]: number[]}} */
const transistorBlockMap = {}

function assignBlocks() {
  for (const t of transdefs) {
    const xblock1 = Math.floor(t[4][0] / 300)
    const yblock1 = Math.floor(t[4][2] / 300)
    const xblock2 = Math.floor(t[4][1] / 300)
    const yblock2 = Math.floor(t[4][3] / 300)
    const key = `${xblock1},${yblock1},${xblock2},${yblock2}`
    if (key in transistorBlockMap) {
      transistorBlockMap[key].push(t[0])
    } else {
      transistorBlockMap[key] = [t[0]]
    }
  }
}
