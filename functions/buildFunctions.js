//setup variables
const auth = require("../auth.json"); //auth token and api key
const util = require("util"); //string formatting
const http = require("https"); //api access
const helperFunctions = require("./helperFunctions"); //helper functions file

var getLastBuild = function(eventVariables, gamertag, gamertagFormatted) {
  //information to connect to haloapi
  const options = {
    hostname: "www.haloapi.com",
    path: util.format("/stats/hw2/players/%s/matches?count=1", gamertagFormatted),
    headers: {
      "Ocp-Apim-Subscription-Key": auth.key
    }
  };

  //get request
  http.get(options, (res) => {
    //check for valid gamertag
    if (res.statusCode == 404) {
      eventVariables.channel.send(util.format("<@!%s>, that gamertag does not exist.", eventVariables.userID));
      return(1);
    }

    //get user stats
    var rawData = "";
    res.on("data", (chunk) => { rawData += chunk; });

    //create and send message when all data is received
    res.on("end", () => {
      //parse data
      const parsedDataHistory = JSON.parse(rawData);

      //check if user has not played games
      if(parsedDataHistory.Results.length == 0) {
        eventVariables.channel.send(util.format("<@!%s>, %s has not played any games.", eventVariables.userID, gamertag));
        return(1);
      }

      //get match id
      var matchID = parsedDataHistory.Results[0].MatchId;

      //api call for build order
      //information to connect to haloapi
      const options = {
        hostname: "www.haloapi.com",
        path: util.format("/stats/hw2/matches/%s/events", matchID),
        headers: {
          "Ocp-Apim-Subscription-Key": auth.key
        }
      };

      //get request
      http.get(options, (res) => {
        //get user stats
        var rawData = "";
        res.on("data", (chunk) => { rawData += chunk; });

        //create and send message when all data is received
        res.on("end", () => {
          //parse data
          const parsedDataEvents = JSON.parse(rawData);

          //check if data was retrieved too quickly
          if(!parsedDataEvents.IsCompleteSetOfEvents) {
            eventVariables.channel.send(util.format("<@!%s>, %s wait a little longer before retrieving.", eventVariables.userID, gamertag));
            return(1);
          }

          //get id of gamertag passed in
          var gamertagID = -1;
          for(var i = 0; i < parsedDataEvents.GameEvents.length; i++) {
            if(parsedDataEvents.GameEvents[i].EventName == "PlayerJoinedMatch" && parsedDataEvents.GameEvents[i].HumanPlayerId != null) {
              if(parsedDataEvents.GameEvents[i].HumanPlayerId.Gamertag.toUpperCase() == gamertag.toUpperCase()) {
                gamertagID = parsedDataEvents.GameEvents[i].PlayerIndex;
                break;
              }
            }
          }

          //check if bot has permission to embed links
          if(!eventVariables.guild.me.permissionsIn(eventVariables.channel).has("EMBED_LINKS")) {
            eventVariables.channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", eventVariables.userID));
            return(1);
          }

          //loop through all events
          var message = "";
          var lines = 0;
          for(var i = 0; i < parsedDataEvents.GameEvents.length; i++) {
            //print message if there are 15 lines
            if(lines == 15) {
              //send embedded message with build order
              eventVariables.channel.send({ embed: {
                color: eventVariables.embedcolor,
                fields: [
                  {
                    name: "Last Build Order for " + gamertag,
                    value: message,
                    inline: false
                  }
                ]
              }});

              lines = 0;
              message = "";
            }

            //if the time is over 5m break out
            if(parsedDataEvents.GameEvents[i].TimeSinceStartMilliseconds  > 300000) {
              break;
            }

            //only add event if it is from given user
            if(parsedDataEvents.GameEvents[i].PlayerIndex == gamertagID) {
              if(parsedDataEvents.GameEvents[i].EventName == "PlayerJoinedMatch") {
                //get leader name of player
                var leaderName = helperFunctions.getLeaderName(parsedDataEvents.GameEvents[i].LeaderId);

                //create message
                message += "**Joined match as**: ";
                message += leaderName;
                message += "\n";
                lines++;
              } else if(parsedDataEvents.GameEvents[i].EventName == "BuildingConstructionCompleted" && parsedDataEvents.GameEvents[i].TimeSinceStartMilliseconds != 0) {
                //get building created
                for(var j = 0; j < parsedDataEvents.GameEvents.length; j++) {
                  if(parsedDataEvents.GameEvents[j].InstanceId == parsedDataEvents.GameEvents[i].InstanceId) {
                    var buildingName = helperFunctions.getBuildingName(parsedDataEvents.GameEvents[j].BuildingId);
                    var time = helperFunctions.formatMs(parsedDataEvents.GameEvents[i].TimeSinceStartMilliseconds);
                    break;
                  }
                }

                if(buildingName != "") {
                  //create message
                  message += "**" + time + "**";
                  message += ": ";
                  message += buildingName;
                  message += " built."
                  message += "\n";
                  lines++;
                }
              } else if(parsedDataEvents.GameEvents[i].EventName == "BuildingUpgraded") {
                //get building name
                var buildingName = helperFunctions.getBuildingName(parsedDataEvents.GameEvents[i].NewBuildingId);

                if(buildingName != "") {
                  //create message
                  message += "**" + helperFunctions.formatMs(parsedDataEvents.GameEvents[i].TimeSinceStartMilliseconds) + "**";
                  message += ": ";
                  message += buildingName;
                  message += " upgraded."
                  message += "\n";
                  lines++;
                }
              }/* else if(parsedDataEvents.GameEvents[i].EventName == "TechResearched") {
                //get tech name
                var techName = helperFunctions.getTechName(parsedDataEvents.GameEvents[i].TechId);

                //create message
                message += "**" + helperFunctions.formatMs(parsedDataEvents.GameEvents[i].TimeSinceStartMilliseconds) + "**";
                message += ": ";
                message += techName;
                message += " researched."
                message += "\n";
                lines++;
              }*/ else if(parsedDataEvents.GameEvents[i].EventName == "UnitTrained" && parsedDataEvents.GameEvents[i].TimeSinceStartMilliseconds != 0 && !parsedDataEvents.GameEvents[i].SquadId.includes("bldg") && !parsedDataEvents.GameEvents[i].SquadId.includes("fx_")) {
                //get unit name
                var unitName = helperFunctions.getUnitName(parsedDataEvents.GameEvents[i].SquadId);

                //create message
                message += "**" + helperFunctions.formatMs(parsedDataEvents.GameEvents[i].TimeSinceStartMilliseconds) + "**";
                message += ": ";
                message += unitName
                message += " trained."
                message += "\n";
                lines++;
              } else if(parsedDataEvents.GameEvents[i].EventName == "PointCaptured") {
                //create message
                message += "**" + helperFunctions.formatMs(parsedDataEvents.GameEvents[i].TimeSinceStartMilliseconds) + "**";
                message += ": Point captured.";
                message += "\n";
                lines++;
              }/* else if(parsedDataEvents.GameEvents[i].EventName == "LeaderPowerUnlocked") {
                //create message
                message += "**" + helperFunctions.formatMs(parsedDataEvents.GameEvents[i].TimeSinceStartMilliseconds) + "**";
                message += ": ";
                message += parsedDataEvents.GameEvents[i].PowerId;
                message += " unlocked."
                message += "\n";
                lines++;
              }*/
            }
          }

          //send embedded message with build order
          eventVariables.channel.send({ embed: {
            color: eventVariables.embedcolor,
            fields: [
              {
                name: "Last Build Order for " + gamertag,
                value: message,
                inline: false
              }
            ]
          }});
        });
      });
    });
  });
}

module.exports.getLastBuild = getLastBuild;
