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
  if (!(array instanceof Array)) return array === testArray;
  console.log(
    `Array ${JSON.stringify(array)} compared to testArray ${JSON.stringify(
      testArray
    )}`
  );
  return (
    array.every((item, index) => assertArray(item, testArray[index])) &&
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

assert("add element with cons", () => {
  return assertArray(eval("((3 4) 3 cons)"), [3, 4, 3]);
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

// assert("cond doesn't execute false clauses", () => {
//   eval("(a' 3 define)");
//   return equalsEval("((1 1 eq?) yay') ((1 2 eq?) (b' 3 define) cond)");
// });

assert("false is false, not a symbol", () => {
  return equalsEval("false", false);
});

//does fibbonacci

assert("fibbonacci", () => {
  //if(n == 0) return 0;
  eval(
    // "(fibbonacci' ((n) (((((n 0 eq?) 0) ((n 1 eq?) 1) (else (((n 1 -) fibbonacci) ((n 2 -) fibbonacci) +)))) cond) lambda) define)"
    // "(fibbonacci' ((n) ((((n 0 eq?) 0) ((n 1 eq?) 1) (else (((n 1 -) fibbonacci) ((n 2 -) fibbonacci) +)) cond) lambda) define)"
    "(fibbonacci' ((n) ((((n 0 eq?) 0) ((n 1 eq?) 1) (else (((n 1 -) fibbonacci) ((n 2 -) fibbonacci) +))) cond) lambda) define)"
  );
  console.log(eval("(0 fibbonacci)"));

  return equalsEval("(3 fibbonacci)", 2); // && equalsEval("(3 fibbonacci)", 2);
});

// make sure 0 is a number and not quoted

assert("make sure 0 is a number and not quoted", () => {
  return equalsEval("0", 0);
});

//more lists
assert("length of list and list of list is retrieved", () => {
  return equalsEval("((0 1 2) len)", 3) && equalsEval("((2 (3 5 6) 4) len)", 3);
});

assert("creates a range of values", () => {
  eval(
    "(_fillRange' ((index' arraySoFar') ((((index 0 eq?) (index arraySoFar cons)) (else ((index 1 -) (index arraySoFar cons) _fillRange))) cond) lambda) define)"
  );

  eval("(fillRange ((rowCount') (rowCount ()' _fillRange) lambda) define)");
  return assertArray(eval("(6 fillRange)"), [0, 1, 2, 3, 4, 5, 6]);
});

assert("map a lambda to a list", () => {
  eval("(testFn' ((a') (a 2 *) lambda) define)");
  return assertArray(eval("((1 2 3) testFn map)"), [2, 4, 6]);
});

assert("get element from list at index", () => {
  return equalsEval("((1 2 3)' 0 get)", 1) && equalsEval("((1 2 3)' 1 get)", 2);
});

assert("two dimensional iteration", () => {
  eval(
    "(bitmap ((0 1 1 0 0 1 1 0) (1 1 0 0 1 0 1 1) (0 0 1 0 1 1 0 0)) define)"
  );
  eval(
    "(checkRules' ((rowIndex' colIndex') (rowIndex colIndex) lambda) define)"
  );
  eval(
    "(parseRow' ((rowIndex') (((((bitmap rowIndex get) len) 1 -) fillRange) ((colIndex) (rowIndex colIndex checkRules) lambda) map) lambda) define)"
  );
  return assertArray(
    eval(
      "((((bitmap len) 1 -) fillRange) ((rowIndex') (rowIndex parseRow) lambda) map)"
    ),
    [
      [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]],
      [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7]],
      [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7]]
    ]
  );
});

assert("two dimensional iteration can be abstracted", () => {
  [
    "(bitmap' ((0 1 1 0 0 1 1 0) (1 1 0 0 1 0 1 1) (0 0 1 0 1 1 0 0)) define)",
    "(checkRules' ((rowIndex' colIndex') (rowIndex colIndex) lambda) define)",
    "(parseRow' ((rowIndex' bitmap' callback') (((((bitmap rowIndex get) len) 1 -) fillRange) ((colIndex) (rowIndex colIndex callback) lambda) map) lambda) define)",
    "(2d_each' ((bitmap' callback') ((((bitmap len) 1 -) fillRange) ((rowIndex') (rowIndex bitmap callback parseRow) lambda) map) lambda) define)"
  ].map(eval);

  return assertArray(eval("(bitmap checkRules 2d_each)"), [
    [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]],
    [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7]],
    [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7]]
  ]);
});
