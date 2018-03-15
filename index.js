let toExport = {};
toExport.eval = function eval(statement) {
  console.log("hello world from index!");
  return true;
};

module.exports = toExport;
