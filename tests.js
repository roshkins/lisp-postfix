const lisp = require("./index.js");
const eval = lisp.eval;
function assert(description, statementCb) {
  console.log(description);
  console.log(statementCb.toString());
  if (statementCb()) {
    console.log("passed!");
  } else {
    console.log("failed :(");
  }
}

assert("eval runs", () => eval("()"));
