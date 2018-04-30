//precision rounding function
var precisionRound = function(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

//function to format milliseconds to minutes and seconds
var formatMs = function(time) {
  //under one minute
  if(time < 60000) {
    var formattedTime = precisionRound(time / 1000, 0) + "s";
    return formattedTime;
  }

  //over one minute
  var timeInSeconds = time/1000;
  var formattedTime = precisionRound(timeInSeconds / 60, 0) + "m ";
  formattedTime += precisionRound(timeInSeconds % 60, 0) + "s";
  return formattedTime;
}

var getLeaderName = function(leaderId) {
  var leaders = ["Cutter", "Isabel", "Anders", "Decimus", "Atriox", "Shipmaster", "Forge", "Kinsano", "Jerome", "Arbiter", "Johnson", "Colony", "Serina", "YapYap", "Pavium", "Voridus"];
  return leaders[leaderId-1];
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
    if(unitId.includes("inf")) {
      if(unitId.includes("generic_marine")) {
        var unitName = "Marine";
      } else if(unitId.includes("flameMarine")) {
        var unitName = "Hellbringer";
      } else if(unitId.includes("sniper")) {
        var unitName = "Sniper";
      } else {
        var unitName = "UNSC Infantry Unit"
      }
    } else if(unitId.includes("veh")) {
      if(unitId.includes("warthog")) {
        var unitName = "Warthog";
      } else if(unitId.includes("wolverine")) {
        var unitName = "Wolverine";
      } else if(unitId.includes("kodiak")) {
        var unitName = "Kodiak";
      } else if(unitId.includes("scorpion")) {
        var unitName = "Scorpion";
      } else if(unitId.includes("grizzly")) {
        var unitName = "Grizzly";
      } else {
        var unitName = "UNSC Vehicle Unit"
      }
    } else if(unitId.includes("air")) {
      if(unitId.includes("hornet")) {
        var unitName = "Hornet";
      } else if(unitId.includes("nightingale")) {
        var unitName = "Nightingale";
      } else if(unitId.includes("vulture")) {
        var unitName = "Vulture";
      } else {
        var unitName = "UNSC Air Unit"
      }
    }
  } else if(unitId.includes("cov")) {
    if(unitId.includes("inf")) {
      if(unitId.includes("generic_grunt")) {
        var unitName = "Grunt";
      } else if(unitId.includes("generic_suicideGrunt")) {
        var unitName = "Suicide Grunts";
      } else if(unitId.includes("generic_brutejumppack")) {
        var unitName = "Jump Pack Brutes";
      } else {
        var unitName = "COV Infantry Unit"
      }
    } else if(unitId.includes("veh")) {
      if(unitId.includes("bruteChopper")) {
        var unitName = "Chopper";
      } else if(unitId.includes("prowler")) {
        var unitName = "Prowler";
      } else if(unitId.includes("locust")) {
        var unitName = "Locust";
      } else if(unitId.includes("gorgon")) {
        var unitName = "Reaver";
      } else {
        var unitName = "COV Vehicle Unit"
      }
    } else if(unitId.includes("air")) {
      if(unitId.includes("shroud")) {
        var unitName = "Shroud";
      } else if(unitId.includes("blisterback")) {
        var unitName = "Blisterback";
      } else if(unitId.includes("phantom")) {
        var unitName = "Phantom";
      } else {
        var unitName = "COV Air Unit"
      }
    }
  } else {
    var unitName = "Unkown Unit"
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
module.exports.getLeaderName = getLeaderName;
module.exports.getBuildingName = getBuildingName;
module.exports.getUnitName = getUnitName;
module.exports.getTechName = getTechName;
