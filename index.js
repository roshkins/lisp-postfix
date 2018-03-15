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
  quote: atom => {
    if (atom[atom.length - 1] === "'") {
      //if quoted, return as is
      return atom;
    } else {
      //else return atom quoted
      return `${atom}'`;
    }
  },
  define: (symbol, value) => {
    toExport.lookup[dequoteHelper(symbol)] = () => value;
  }
};

function lookupSymbol(symbol) {
  const unquotedSymbol = dequoteHelper(symbol);
  return toExport.lookup[unquotedSymbol];
}

function dequoteHelper(symbol) {
  if (symbol[symbol.length - 1] === "'") {
    symbol = symbol.slice(0, symbol.length - 1);
  }
  return symbol;
}
//creates a function that maps over any number of arguments from 2 args
function argsAccumulatorHelper(callback) {
  return (...args) => [...args].reduce(callback);
}
toExport.eval = function eval(statement) {
  const lookup = toExport.lookup;
  //check if parens, signifying a list
  if (statement[0] === "(" && statement[statement.length - 1] === ")") {
    //parse list
    const parsed = toExport.parse(statement);
    if (parsed.length < 1) return "()'";
    //map eval to each element in list
    const evaled = parsed.map(toExport.eval);
    console.log(evaled);
    //pop last function from stack
    const executingFunction = evaled.pop();
    //use javascript apply to pass in all other elements as parameters
    return executingFunction.apply(null, evaled);
  } else {
    let parsingStatement = statement.trim();
    //lookup and return function from lookup table, if none, try parsing it as a number, else return quoted atom
    return (
      lookupSymbol(parsingStatement) ||
      Number(parsingStatement) ||
      lookupSymbol("quote")(parsingStatement)
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
