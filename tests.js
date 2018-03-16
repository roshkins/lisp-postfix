const lisp = require("./index.js");
const eval = lisp.eval;
const parse = lisp.parse;
const lookup = lisp.lookup;
let passed = 0;
let failed = 0;
let total = 0;
function assert(description, statementCb) {
  console.log(description);
  console.log(statementCb.toString());
  if (statementCb()) {
    console.log("passed!");
    passed++;
  } else {
    console.error("failed :(");
    failed++;
  }
  total++;

  console.log(`Passed ${passed} Failed ${failed} / total ${total}`);
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
    )} and is ${!!result}y expected: ${JSON.stringify(
      expected
    )} and is ${!!expected}y`
  );
  return result === expected;
}

function equalsEval(expression, result) {
  return equals(eval(expression), result);
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
  equalsEval("((1 2 3)' quote)", "(1 2 3)'")
);

//define

assert("define binds values to symbols", () => {
  eval("(a 5 define)");
  console.log(lisp.lookup);
  return weakEquals(!!lisp.lookupSymbol("a'"), true) && equals(eval("a"), 5);
});

// cons, car, cdr

assert("cons, car, cdr work", () => {
  eval("(box (3 4 cons) define)");
  return equals(eval("(box car)"), 3) && assertArray(eval("(box cdr)"), [4]);
});

//symbols
assert("symbols are symbols", () => {
  return equals(lisp.isSymbol("(1 2 3)'"), true);
});

//lists work

assert("simple symbol list evals to array", () => {
  return assertArray(eval("(1 2 3)'"), [1, 2, 3]);
});

assert("lists work", () => {
  eval("(some-list (1 2 3)' define)");
  console.log(lisp.lookup);
  return (
    equalsEval("(some-list car)", 1) &&
    assertArray(eval("(some-list cdr)"), [2, 3]) &&
    assertArray(eval("(((some-list cdr) cdr) cdr)"), [])
  );
});

//atoms exist

assert("atoms exist", () => {
  return (
    equalsEval("(2 atom?)", true) &&
    equalsEval("(2' atom?)", false) &&
    equalsEval("((1 2) atom?)", false)
  );
});

// lambdas should work

assert("simple lambda works", () => {
  eval("(square ((x) (x x *) lambda) define)");
  console.log(lisp.lookup);
  return equalsEval("(5 square)", 25);
});

assert("complex lambda works", () => {
  eval("(divides_evenly? ((x y) ((x (x y /) *) y eq?) lambda) define)");
  console.log(lisp.lookup);
  return (
    equalsEval("(5 2 divides_evenly?)", false) &&
    equalsEval("(1 1 divides_evenly?)", true)
  );
});

//cond should conditional a statement
assert("cond chooses the correct symbol", () => {
  eval("(a' 3 define)");
  console.log(lisp.lookup);
  return equalsEval(
    "((((a 1 eq?) one') ((a 2 eq?) two') ((a 3 eq?) three') (else no-idea')) cond)",
    "three'"
  );
});
