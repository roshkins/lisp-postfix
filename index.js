let toExport = {};
toExport.eval = function eval(statement) {
  console.log("hello world from index!");
  return true;
};

toExport.parse = function parse(statement) {
  //remove parens
  //loop through each character
  //keep a count of how many open - closed parens seen
  //if 0 count parens && a is a space, push onto stack
  //return stack
};
module.exports = toExport;
