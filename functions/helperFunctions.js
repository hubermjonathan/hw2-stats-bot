//precision rounding function
var precisionRound = function(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

//array shuffling function
var arrayShuffle = function(array) {
  var currentIndex = array.length;
  var temporaryValue;
  var randomIndex;

  //run until no elements are left
  while (0 !== currentIndex) {

    //pick and element
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    //swap
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

module.exports.precisionRound =  precisionRound;
module.exports.arrayShuffle = arrayShuffle;
