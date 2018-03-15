const lisp = require("./index.js");
const eval = lisp.eval;
const parse = lisp.parse;
const lookup = lisp.lookup;
function assert(description, statementCb) {
  console.log(description);
  console.log(statementCb.toString());
  if (statementCb()) {
    console.log("passed!");
  } else {
    console.error("failed :(");
  }
  console.log("\n\n");
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

function equals(result, expected) {
  console.log(
    `result: ${JSON.stringify(result)} expected: ${JSON.stringify(expected)}`
  );
  return result === expected;
}

function weakEquals(result, expected) {
  console.log(
    `result: ${JSON.stringify(
      result
    )} and is ${!!result} expected: ${JSON.stringify(
      expected
    )} and is ${!!expected}`
  );
  return result === expected;
}

assert("eval runs and returns nil", () => equals(eval("()"), "()'"));

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

assert("evals single number", () => equals(eval("2"), 2));
assert("evals symbol not in lookup", () => equals(eval("pie"), "pie'"));

//lookup
assert("lookup computes addition properly", () => equals(lookup["+"](2, 3), 5));

assert("evals simple addition", () => equals(eval("(2 3 +)"), 5));
assert("evals multi-term addition", () => equals(eval("(2 3 5 +)"), 10));
assert("evals simple subtraction", () => equals(eval("(2 3 -)"), -1));
assert("evals multi-term subtraction with negative", () =>
  equals(eval("(2 3 -4 -)"), 3)
);
assert("evals multiply", () => equals(eval("(5 3 -2 *)"), -30));
assert("evals multiply with decimal", () => equals(eval("(7.5 -2 *)"), -15));
assert("evals division", () => equals(eval("(6 2 /)"), 3));
assert("evauls division with decimal", () => equals(eval("(7 2 /)"), 3.5));

//recursion
assert("addition recursively adds", () => equals(eval("((5 5 +) 5 +)"), 15));

assert("operations order maintained", () => equals(eval("((2 10 +) 3 /)"), 4));

assert(
  "eq? tests equality of numbers",
  () =>
    equals(eval("((2 2 eq?) (2 2 eq?) eq?)"), true) &&
    equals(eval("((2 2 eq?) (3 2 eq?) eq?)"), false)
);

assert("quote returns a symbol", () => equals(eval("(a quote)"), "a'"));
assert("and lists can be symbols", () =>
  equals(eval("((1 2 3)' quote)"), "(1 2 3)'")
);

//define

assert("define binds values to symbols", () => {
  eval("(define a 5)");
  return equals(eval("a"), 5);
});

//quoted atoms lookup no matter what
