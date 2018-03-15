const lisp = require("./index.js");
const eval = lisp.eval;
const parse = lisp.parse;
function assert(description, statementCb) {
  console.log(description);
  console.log(statementCb.toString());
  if (statementCb()) {
    console.log("passed!");
  } else {
    console.log("failed :(");
  }
}

function assertArray(array, testArray) {
  console.log(
    `Array ${JSON.stringify(array)} compared to testArray ${JSON.stringify(
      testArray
    )}`
  );
  return (
    array.every((item, index) => item === testArray[index]) &&
    array.length === testArray.length
  );
}

assert("eval runs", () => eval("()"));

assert("parses addition", () => {
  let array = parse("(2 2 +)");
  let testArray = ["2", "2", "+"];
  return assertArray(array, testArray);
});
