let toExport = {};
const debug = true;
//specify lookup table
toExport.lookup = {
  "+": argsAccumulatorHelper((num1, num2) => num1 + num2),
  "-": argsAccumulatorHelper((num1, num2) => num1 - num2),
  "*": argsAccumulatorHelper((num1, num2) => num1 * num2),
  "/": argsAccumulatorHelper((num1, num2) => num1 / num2),
  "eq?": (num1, num2) => num1 === num2,
  "lt?": (num1, num2) => num1 < num2,
  log: (...args) => console.log(args),
  true: true,
  false: false,
  len: list => list.length,
  quote: item => {
    if (item instanceof Array) return symbolizeArray(item);
    if (item[item.length - 1] === "'") {
      //if quoted, return as is
      return item;
    } else {
      //else return item quoted
      return `${item}'`;
    }
  },
  map: (list, fn) => {
    return list.map(element => fn(element));
  },
  get: (list, index) => list[index],
  "atom?": item => !isSymbol(item) && item.length === undefined,
  define: (symbol, value) => {
    //if symbol
    //if the value is a string dequote the value and parse it into a parsed array
    if (typeof value === "string" && isSymbol(value)) {
      const parsedAndDequoted = toExport.parse(dequoteHelper(value));
      toExport.lookup[dequoteHelper(symbol)] = parsedAndDequoted;
    } else {
      toExport.lookup[dequoteHelper(symbol)] = value;
      if (debug) console.log(`Assigned ${symbol} ${value}`);
    }
  },
  cons: (a, b) => {
    if (a instanceof Array) {
      return a.concat(b);
    } else {
      return [a].concat(b);
    }
  },
  car: consArray => toExport.eval(consArray[0]),
  cdr: consArray => [...consArray].slice(1),
  lambda: (args, code) => {
    return (...lambdaArgs) => {
      if (debug) console.log(`lambdaArgs ${lambdaArgs}`);
      //create new temp scope
      let oldScope = {};
      //go through all arguments given when lambda was defined
      args.forEach(
        (symbol, index) =>
          (oldScope[dequoteHelper(symbol)] =
            toExport.lookup[dequoteHelper(symbol)])
      );
      //put the new values in the scope
      args.forEach(
        (symbol, index) =>
          (toExport.lookup[dequoteHelper(symbol)] = lambdaArgs[index])
      );
      if (debug) console.log("scope " + JSON.stringify(toExport.lookup));
      //run code
      let retVal = toExport.eval(code);
      //restore scope
      args.forEach(
        (symbol, index) =>
          (toExport.lookup[dequoteHelper(symbol)] =
            oldScope[dequoteHelper(symbol)])
      );
      return retVal;
    };
  },
  cond: clauses => {
    //parse clauses first
    const parsedClauses = clauses.map(toExport.parse);
    console.log("parsedClauses " + JSON.stringify(parsedClauses));
    for (clause of parsedClauses) {
      if (debug) console.log("clause" + clause);
      if (clause[0] === "else") {
        console.log("in else clause");
        console.log("lookup");
        console.log(toExport.lookup);

        const returnedVal = toExport.eval(clause[1]);
        console.log("clause return " + returnedVal);
        return returnedVal;
      }
      if (toExport.eval(clause[0])) {
        console.log("in clause that executed" + clause[0]);
        console.log("lookup");
        console.log(toExport.lookup);
        const returnedVal = toExport.eval(clause[1]);
        console.log("clause return " + returnedVal);
        return returnedVal;
      }
    }
  }
};

const symbolizeArray = (toExport.symbolizeArray = array =>
  `(${array.join(" ")})'`);

const isSymbol = (toExport.isSymbol = function isSymbol(possibleSymbol) {
  return possibleSymbol[possibleSymbol.length - 1] === "'";
});

toExport.lookupSymbol = function lookupSymbol(symbol, scope = toExport.lookup) {
  const unquotedSymbol = dequoteHelper(symbol);
  return scope[unquotedSymbol];
};

function dequoteHelper(symbol) {
  if (isSymbol(symbol)) {
    symbol = symbol.slice(0, symbol.length - 1);
  }
  return symbol;
}
//creates a function that maps over any number of arguments from 2 args
function argsAccumulatorHelper(callback) {
  return (...args) => {
    if (debug) console.log("args in accumulator helper ", [...args]);
    return [...args].reduce(callback);
  };
}

function convert(statement) {
  //handle different statement types
  if (typeof statement === "number" || !isNaN(Number(statement)))
    return Number(statement);
  if (statement instanceof Array) return Array;
  return false;
}
function isConvertable(statement) {
  return (
    typeof statement === "number" ||
    !isNaN(Number(statement)) ||
    statement instanceof Array
  );
}
function convertToString(statement) {
  if (statement instanceof Array) return symbolizeArray(statement);
  if (typeof statement === "number") return "" + statement;
  return statement;
}
toExport.stringEval = function stringEval(statement) {
  return convertToString(toExport.eval(statement));
};
toExport.eval = function eval(statement, scopeObj) {
  //return anything that is already a javascript primative like an array
  if (isConvertable(statement)) return convert(statement);
  const scope = Object.assign({}, toExport.lookup, scopeObj);
  //check if parens, signifying a list
  if (statement[0] === "(" && statement[statement.length - 1] === ")") {
    const parsed = toExport.parse(statement);
    if (parsed.length < 1) return "()'";
    //map eval to each element in list if not conditional
    let evaled;
    switch (parsed[parsed.length - 1]) {
      case "cond":
        const parsedCond = toExport.parse(parsed[0]);
        console.log("found cond" + JSON.stringify(parsedCond));
        return toExport.lookupSymbol("cond'")(parsedCond);
        break;
      case "lambda":
        if (debug) console.log("LABMDA " + parsed[parsed.length - 2]);
        return toExport.lookupSymbol("lambda'")(
          toExport.eval(parsed[0]),
          parsed[1]
        );
      default:
        evaled = parsed.map(token => toExport.eval(token, scope));
    }

    //if last element is a function, run it on everything
    if (evaled[evaled.length - 1] instanceof Function) {
      //if it's a lambda, store the code as a string
      console.log("last element of parsed" + parsed[parsed.length - 1]);
      console.log("parsed: " + JSON.stringify(parsed));

      //pop last function from stack
      const executingFunction = evaled.pop();
      //use javascript apply to pass in all other elements as parameters
      const evaledTo = executingFunction.apply(null, evaled);
      if (debug)
        console.log(
          "return value of evaluated method" + JSON.stringify(evaledTo)
        );
      return evaledTo;
    } else {
      //else return as array
      return evaled;
    }
  } else {
    let parsingStatement = statement.trim();
    if (debug) console.log("Parsing statement", parsingStatement);

    //parse symbol
    if (debug) console.log("statement" + statement);
    if (isSymbol(statement)) {
      if (debug) console.log("is symbol");
      //if it's a list, we need to evaluate it so we can manipulate it
      if (statement[0] === "(" && statement[statement.length - 2] === ")") {
        //takes of last '
        const parsed = toExport.parse(statement.slice(0, statement.length - 1));
        if (debug) console.log("parsed statement", parsed);
        return parsed.map(toExport.eval);
      } else {
        //if it's not a list, we should leave it as is
        return statement;
      }
    }

    //lookup and return result of function from lookup table, if none, try parsing it as a number "   2 ", else return quoted symbol
    const assosciatedFn = toExport.lookupSymbol(parsingStatement);
    if (assosciatedFn !== undefined) return assosciatedFn;
    return (
      // Number(parsingStatement) ||
      toExport.lookupSymbol("quote", scope)(parsingStatement)
    );
  }
};

toExport.parse = function parse(statement) {
  let deparensStatement = statement;
  //remove parens (assuming valid statement)
  if (statement[0] === "(") {
    deparensStatement = statement.slice(1, statement.length - 1);
  }
  //loop through each character
  //keep a count of how many open - closed parens seen
  let openMinusClosed = 0;
  let token = "";
  let stack = [];
  deparensStatement.split("").forEach(char => {
    //skip char in token
    let skip = false;
    switch (char) {
      case "(":
        openMinusClosed++;
        break;
      case ")":
        openMinusClosed--;
        break;
      case " ":
        //if 0 count parens && char is a space, push onto stack
        if (openMinusClosed === 0) {
          //push token
          stack.push(token);
          token = "";
          //skip space
          skip = true;
        }
        break;
    }
    //add to current token
    if (!skip) token += char;
  });
  //push last token to stack if token exists
  if (token.length > 0) stack.push(token);
  //return stack
  return stack;
};
module.exports = toExport;

console.log(
  "Welcome to Rashi's super amazing lisp postfix interpreter! Entering a REPL now! Type .exit to exit."
);

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function repl() {
  rl.question(
    "What is your bidding? (tell me your bidding with a lisp)",
    bidding => {
      // TODO: Log the answer in a database
      if (bidding.trim() === ".exit") return rl.close();
      console.log(toExport.stringEval(bidding));
      repl();
    }
  );
}

repl();
