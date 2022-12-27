const fs = require('fs');
const readline = require('readline');

var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('wire.txt')
});
let lineCount = 0;
let accuracy = 0;
lineReader.on('line', function (line) {
  if (lineCount++ == 0) return;
  // console.log('Line from file:', line);
  const arr = line.split(" ");
  const v1 = arr[869];
  const v2 = arr[349];
  accuracy += (v1 != v2) ? 1 : 0;
})
  .on('close', function () {
    console.log("accuracy: ", accuracy);
  });