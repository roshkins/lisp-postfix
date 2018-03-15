let toExport = {};
//specify lookup table
toExport.lookup = {
  "+": argsAccumulatorHelper((num1, num2) => num1 + num2),
  "-": argsAccumulatorHelper((num1, num2) => num1 - num2),
  "*": argsAccumulatorHelper((num1, num2) => num1 * num2),
  "/": argsAccumulatorHelper((num1, num2) => num1 / num2),
  "eq?": (num1, num2) => num1 === num2,
  true: true,
  false: false,
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
  "atom?": item => !isSymbol(item) && item.length === undefined,
  define: (symbol, value) => {
    //if symbol
    //dequote the value and parse it into a parsed array
    if (isSymbol(value)) {
      const parsedAndDequoted = toExport.parse(dequoteHelper(value));
      toExport.lookup[dequoteHelper(symbol)] = parsedAndDequoted;
    } else {
      toExport.lookup[dequoteHelper(symbol)] = value;
    }
  },
  cons: (a, b) => [a, b],
  car: consArray => toExport.eval(consArray[0]),
  cdr: consArray => [...consArray].slice(1)
};

const symbolizeArray = (toExport.symbolizeArray = array =>
  `(${array.join(" ")})'`);

const isSymbol = (toExport.isSymbol = function isSymbol(possibleSymbol) {
  return possibleSymbol[possibleSymbol.length - 1] === "'";
});

toExport.lookupSymbol = function lookupSymbol(symbol) {
  const unquotedSymbol = dequoteHelper(symbol);
  return toExport.lookup[unquotedSymbol];
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
    console.log([...args]);
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
function convertToString(statement) {
  if (statement instanceof Array) return symbolizeArray(statement);
  if (typeof statement === "number") return "" + statement;
  return statement;
}
toExport.stringEval = function stringEval(statement) {
  convertToString(toExport.eval(statement));
};
toExport.eval = function eval(statement) {
  //return anything that is a primative
  if (convert(statement)) return convert(statement);
  const lookup = toExport.lookup;

  //check if parens, signifying a list
  if (statement[0] === "(" && statement[statement.length - 1] === ")") {
    const parsed = toExport.parse(statement);
    if (parsed.length < 1) return "()'";
    //map eval to each element in list
    const evaled = parsed.map(toExport.eval);
    console.log("evaled ", evaled);
    //pop last function from stack
    const executingFunction = evaled.pop();
    //use javascript apply to pass in all other elements as parameters
    return executingFunction.apply(null, evaled);
  } else {
    let parsingStatement = statement.trim();
    console.log("Parsing statement", parsingStatement);

    //parse symbol
    console.log(statement);
    if (isSymbol(statement)) {
      console.log("is symbol");
      const parsed = toExport.parse(statement.slice(0, statement.length - 1));
      console.log("parsed statement", parsed);
      return parsed.map(toExport.eval);
    }

    //lookup and return result of function from lookup table, if none, try parsing it as a number, else return quoted symbol
    const assosciatedFn = toExport.lookupSymbol(parsingStatement);
    if (assosciatedFn) return assosciatedFn;
    return (
      Number(parsingStatement) ||
      toExport.lookupSymbol("quote")(parsingStatement)
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
