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

assert("parses simple recursion", () =>
  assertArray(parse("((4 2 /) 3 +)"), ["(4 2 /)", "3", "+"])
);

assert("parses symbols", () =>
  assertArray(parse("((2 3 +) 4 exp)"), ["(2 3 +)", "4", "exp"])
);

assert("parses quote", () =>
  assertArray(parse("((2 3 +)' a' b)"), ["(2 3 +)'", "a'", "b"])
);
