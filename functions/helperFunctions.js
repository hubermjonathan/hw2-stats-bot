//precision rounding function
var precisionRound = function(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

//function to format milliseconds to minutes and seconds
var formatMs = function(time) {
  //under one minute
  if(time < 60000) {
    var formattedTime = precisionRound(time / 1000, 2) + "s";
    return formattedTime;
  }

  //over one minute
  var timeInSeconds = time/1000;
  var formattedTime = precisionRound(timeInSeconds / 60, 0) + "m ";
  formattedTime += precisionRound(timeInSeconds % 60, 2) + "s";
  return formattedTime;
}

var getBuildingName = function(buildingId) {
  if(buildingId.includes("unsc")) {
    if(buildingId.includes("supplypad")) {
      var buildingName = "Supply Pad";
    } else if(buildingId.includes("reactor")) {
      var buildingName = "Generator";
    } else if(buildingId.includes("command")) {
      var buildingName = "Base";
    } else if(buildingId.includes("minibase")) {
      var buildingName = "Mini Base";
    } else if(buildingId.includes("fieldArmory")) {
      var buildingName = "Armory";
    } else if(buildingId.includes("barracks")) {
      var buildingName = "Barracks";
    } else if(buildingId.includes("vehicle")) {
      var buildingName = "Garage";
    } else if(buildingId.includes("air")) {
      var buildingName = "Airpad";
    } else {
      var buildingName = "";
    }
  }
  if(buildingId.includes("cov")) {
    if(buildingId.includes("supply")) {
      var buildingName = "Harvester";
    } else if(buildingId.includes("reactor")) {
      var buildingName = "Power Extractor";
    } else if(buildingId.includes("builder")) {
      var buildingName = "Base";
    } else if(buildingId.includes("minibase")) {
      var buildingName = "Mini Base";
    } else if(buildingId.includes("temple")) {
      var buildingName = "War Council";
    } else if(buildingId.includes("barracks")) {
      var buildingName = "Raid Camp";
    } else if(buildingId.includes("heavyfactory")) {
      var buildingName = "Foundry";
    } else if(buildingId.includes("lightfactory")) {
      var buildingName = "Apex";
    } else {
      var buildingName = "";
    }
  }

  return buildingName;
}

var getUnitName = function(unitId) {
  if(unitId.includes("unsc")) {
    var unitName = "UNSC unit";
  }
  if(unitId.includes("cov")) {
    var unitName = "COV unit";
  }

  return unitName;
}

var getTechName = function(techId) {
  if(techId.includes("unsc")) {
    var techName = "UNSC power";
  }
  if(techId.includes("cov")) {
    var techName = "COV power";
  }

  return techName;
}

module.exports.precisionRound =  precisionRound;
module.exports.formatMs = formatMs;
module.exports.getBuildingName = getBuildingName;
module.exports.getUnitName = getUnitName;
module.exports.getTechName = getTechName;
