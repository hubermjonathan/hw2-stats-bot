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
  if(timeInSeconds % 60 != 0 && precisionRound(timeInSeconds+0.5, 0) % 60 == 0) {
    timeInSeconds -= 0.5;
  }
  var formattedTime = Math.trunc(timeInSeconds / 60) + "m ";
  formattedTime += precisionRound(timeInSeconds % 60, 0) + "s";
  return formattedTime;
}

//function to get leader name from api id
var getLeaderName = function(leaderId) {
  var leaders = ["Cutter", "Isabel", "Anders", "Decimus", "Atriox", "Shipmaster", "Forge", "Kinsano", "Jerome", "Arbiter", "Johnson", "Colony", "Serina", "YapYap", "Pavium", "Voridus"];
  return leaders[leaderId-1];
}

//function to get building name from api id
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

//function to get unit name from api id
var getUnitName = function(unitId) {
  if(unitId.includes("unsc")) {
    if(unitId.includes("inf")) {
      if(unitId.includes("generic_marine")) {
        var unitName = "Marine";
      } else if(unitId.includes("flameMarine_01")) {
        var unitName = "Hellbringer";
      } else if(unitId.includes("sniper_01")) {
        var unitName = "Sniper";
      } else if(unitId.includes("cyclops_01")) {
        var unitName = "Cyclops";
      } else if(unitId.includes("serina_cryomarines_01")) {
        var unitName = "Cryo Trooper";
      } else if(unitId.includes("spartan_mpdoug_01")) {
        var unitName = "Douglas Hero Unit";
      } else if(unitId.includes("spartan_mpalice_01")) {
        var unitName = "Isabel Hero Unit";
      } else if(unitId.includes("johnson_hero_01")) {
        var unitName = "Johnson Hero Unit";
      } else if(unitId.includes("flamecyclops_01")) {
        var unitName = "Kinsano Hero Unit";
      } else if(unitId.includes("mpjerome_01")) {
        var unitName = "Cutter Hero Unit";
      } else if(unitId.includes("omegateam_jerome_01")) {
        var unitName = "Jerome Hero Unit";
      } else {
        var unitName = unitId;
      }
    } else if(unitId.includes("veh")) {
      if(unitId.includes("warthog_01")) {
        var unitName = "Warthog";
      } else if(unitId.includes("wolverine_01")) {
        var unitName = "Wolverine";
      } else if(unitId.includes("foxcannon_01")) {
        var unitName = "Kodiak";
      } else if(unitId.includes("scorpion_01")) {
        var unitName = "Scorpion";
      } else if(unitId.includes("grizzly_01")) {
        var unitName = "Grizzly";
      } else if(unitId.includes("mongoose_01")) {
        var unitName = "Jackrabbit";
      } else if(unitId.includes("flamehog_01")) {
        var unitName = "Flame Warthog";
      } else if(unitId.includes("johnson_mantis_01")) {
        var unitName = "Mantis";
      } else if(unitId.includes("battleapc_01")) {
        var unitName = "Mastodon";
      } else if(unitId.includes("johnson_colossus_01")) {
        var unitName = "Colossus";
      } else if(unitId.includes("serina_hero_01")) {
        var unitName = "Serina Hero Unit";
      } else if(unitId.includes("jerome_mantis_01")) {
        var unitName = "Command Mantis";
      } else if(unitId.includes("forgehog_01")) {
        var unitName = "Forge Hero Unit";
      } else {
        var unitName = unitId;
      }
    } else if(unitId.includes("air")) {
      if(unitId.includes("hornet_01")) {
        var unitName = "Hornet";
      } else if(unitId.includes("nightingale_01")) {
        var unitName = "Nightingale";
      } else if(unitId.includes("vulture_01")) {
        var unitName = "Vulture";
      } else if(unitId.includes("serina_pegasus_01")) {
        var unitName = "Frostraven";
      } else if(unitId.includes("destroyer_01")) {
        var unitName = "Condor";
      } else {
        var unitName = unitId;
      }
    }
  } else if(unitId.includes("cov")) {
    if(unitId.includes("inf")) {
      if(unitId.includes("generic_grunt")) {
        var unitName = "Grunt Squad";
      } else if(unitId.includes("arbitergruntsquad")) {
        var unitName = "Elite Grunt Squad";
      } else if(unitId.includes("generic_suicideGrunt")) {
        var unitName = "Suicide Grunts";
      } else if(unitId.includes("generic_brutejumppack")) {
        var unitName = "Jump Pack Brutes";
      } else if(unitId.includes("jackal_01")) {
        var unitName = "Elite Ranger";
      } else if(unitId.includes("engineer_01")) {
        var unitName = "Engineer";
      } else if(unitId.includes("corruptedengineer_01")) {
        var unitName = "Infused Engineer";
      } else if(unitId.includes("hunter_01")) {
        var unitName = "Hunter";
      } else if(unitId.includes("generic_brutejumppack")) {
        var unitName = "Jump Pack Brutes";
      } else if(unitId.includes("lekgologoliath_01")) {
        var unitName = "Goliath";
      } else if(unitId.includes("arbiterenforcer")) {
        var unitName = "Elite Enforcer";
      } else if(unitId.includes("gruntswarm_01")) {
        var unitName = "Cannon Fodder";
      } else if(unitId.includes("heavygrunt_02")) {
        var unitName = "Heavy Grunts";
      } else if(unitId.includes("bruterider_01")) {
        var unitName = "Grunt Riders";
      } else if(unitId.includes("brutegrenadier_01")) {
        var unitName = "Brute Grenadiers";
      } else if(unitId.includes("atrioxchosen_01")) {
        var unitName = "Atriox Hero Unit";
      } else if(unitId.includes("bruteHonour_01")) {
        var unitName = "Decimus Hero Unit";
      } else if(unitId.includes("mpdecimus_01")) {
        var unitName = "Decimus";
      } else if(unitId.includes("eliteCommando_01")) {
        var unitName = "Shipmaster Hero Unit";
      } else if(unitId.includes("impervioushunter_01")) {
        var unitName = "Colony Hero Unit";
      } else if(unitId.includes("arbiter_01")) {
        var unitName = "Arbiter Hero Unit";
      } else if(unitId.includes("corruptedwarlord_01")) {
        var unitName = "Voridus Hero Unit";
      } else if(unitId.includes("mortarwarlord_01")) {
        var unitName = "Pavium Hero Unit";
      } else if(unitId.includes("gruntgoblin01")) {
        var unitName = "YapYap Hero Unit";
      } else {
        var unitName = unitId;
      }
    } else if(unitId.includes("veh")) {
      if(unitId.includes("bruteChopper_01")) {
        var unitName = "Chopper";
      } else if(unitId.includes("prowler_01")) {
        var unitName = "Marauder";
      } else if(unitId.includes("locust_01")) {
        var unitName = "Locust";
      } else if(unitId.includes("gorgon_01")) {
        var unitName = "Reaver";
      } else if(unitId.includes("wraith_01")) {
        var unitName = "Wraith";
      } else if(unitId.includes("ghost_01")) {
        var unitName = "Ghost";
      } else if(unitId.includes("skitterer_01")) {
        var unitName = "Skitterer";
      } else if(unitId.includes("wraithapc_01")) {
        var unitName = "Wraith Invader";
      } else if(unitId.includes("grunt_methanewagon_01")) {
        var unitName = "Methane Wagon";
      } else if(unitId.includes("scarab_01")) {
        var unitName = "Scarab";
      } else {
        var unitName = unitId;
      }
    } else if(unitId.includes("air")) {
      if(unitId.includes("shroud_01")) {
        var unitName = "Shroud";
      } else if(unitId.includes("blisterback_01")) {
        var unitName = "Blisterback";
      } else if(unitId.includes("phantom_01")) {
        var unitName = "Phantom";
      } else if(unitId.includes("banshee_01")) {
        var unitName = "Banshee";
      } else {
        var unitName = unitId;
      }
    }
  } else {
    if(unitId.includes("sentineltier2_generic")) {
      var unitName = "Protector Sentinel";
    } else {
      var unitName = unitId;
    }
  }

  return unitName;
}

//function to get tech name from api id
var getTechName = function(techId) {
  return techId;
}

module.exports.precisionRound =  precisionRound;
module.exports.formatMs = formatMs;
module.exports.getLeaderName = getLeaderName;
module.exports.getBuildingName = getBuildingName;
module.exports.getUnitName = getUnitName;
module.exports.getTechName = getTechName;
