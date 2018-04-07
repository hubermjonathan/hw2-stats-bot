//checks if the userID is the owner of the server
var checkIfOwner = function checkIfOwner(user, guild) {

  if(user.id == guild.ownerID || user.id == "196141424318611457") {
    return(true);
  } else {
    return(false);
  }

}

//round to a decimal point
var round = function round(number, precision) {

  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;

}

module.exports.checkIfOwner = checkIfOwner;
module.exports.round = round;
