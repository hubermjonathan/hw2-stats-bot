//setup variables
const util = require("util"); //string formatting
const http = require("https"); //api access
const helperFunctions = require("./helperFunctions"); //helper functions file

var getTeamWar = function(options, eventVariables, gamertag) {
  //get request
  http.get(options, (res) => {
    //check for valid gamertag
    if (res.statusCode == 404) {
      eventVariables.channel.send(util.format("<@!%s>, that gamertag does not exist.", eventVariables.userID));
      return(1);
    }

    //get user stats from api
    var rawData = "";
    res.on("data", (chunk) => { rawData += chunk; });

    //create and send message when all data is received
    res.on("end", () => {
      //parse data
      const parsedData = JSON.parse(rawData);

      //check if user has not played games
      if(parsedData.MatchmakingSummary.SocialPlaylistStats.length == 0) {
        eventVariables.channel.send(util.format("<@!%s>, %s has not played any unranked games.", eventVariables.userID, gamertag));
        return(1);
      }

      //find correct index
      var index = -1;
      for(var i = 0; i < parsedData.MatchmakingSummary.SocialPlaylistStats.length; i++) {
        //find team war id
        if(parsedData.MatchmakingSummary.SocialPlaylistStats[i].PlaylistId == "282fc197-7bf1-4865-81ec-a312d07567b6") {
          index = i;
          break;
        }
      }

      //get data for games section
      //get and format time played
      var timeISO = parsedData.MatchmakingSummary.SocialPlaylistStats[index].TotalTimePlayed;
      var timePlayed = "";
      if(timeISO.includes("D")) {
        timePlayed += timeISO.substring(timeISO.indexOf("P")+1, timeISO.indexOf("D"));
        timePlayed += "d ";
      }
      if(timeISO.includes("H")) {
        timePlayed += timeISO.substring(timeISO.indexOf("T")+1, timeISO.indexOf("H"));
        timePlayed += "h ";
      }
      if(timeISO.includes("M")) {
        if(timeISO.substring(timeISO.indexOf("M")-2, timeISO.indexOf("M")).includes("H") || timeISO.substring(timeISO.indexOf("M")-2, timeISO.indexOf("M")).includes("T")) {
          timePlayed += timeISO.substring(timeISO.indexOf("M")-1, timeISO.indexOf("M"));
          timePlayed += "m";
        } else {
          timePlayed += timeISO.substring(timeISO.indexOf("M")-2, timeISO.indexOf("M"));
          timePlayed += "m";
        }
      }

      //get games information
      var gamesPlayed = parsedData.MatchmakingSummary.SocialPlaylistStats[index].TotalMatchesStarted;
      var gamesWon = parsedData.MatchmakingSummary.SocialPlaylistStats[index].TotalMatchesWon;
      var gamesLost = parsedData.MatchmakingSummary.SocialPlaylistStats[index].TotalMatchesLost;
      var winPercent = helperFunctions.precisionRound((gamesWon / gamesPlayed) * 100, 2);

      //create games message
      var gamesMessage = "Time played: "+ timePlayed +"\n";
      gamesMessage += "Games played: "+ gamesPlayed +"\n";
      gamesMessage += "Games won: "+ gamesWon +"\n";
      gamesMessage += "Games lost: "+ gamesLost +"\n";
      gamesMessage += "Win percentage: "+ winPercent +"%";

      //get data for leader section
      //get favorite leader
      var max = -1;
      var favoriteLeader = "";
      for(var leader in parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats) {
        if(parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[leader].TotalMatchesStarted > max) {
          max = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[leader].TotalMatchesStarted;
          favoriteLeader = leader;
        }
      }

      //get and format time played
      var leaderISO = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[favoriteLeader].TotalTimePlayed;
      var leaderTimePlayed = "";
      if(leaderISO.includes("D")) {
        leaderTimePlayed += leaderISO.substring(leaderISO.indexOf("P")+1, leaderISO.indexOf("D"));
        leaderTimePlayed += "d ";
      }
      if(leaderISO.includes("H")) {
        leaderTimePlayed += leaderISO.substring(leaderISO.indexOf("T")+1, leaderISO.indexOf("H"));
        leaderTimePlayed += "h ";
      }
      if(leaderISO.includes("M")) {
        if(leaderISO.substring(leaderISO.indexOf("M")-2, leaderISO.indexOf("M")).includes("H") || leaderISO.substring(leaderISO.indexOf("M")-2, leaderISO.indexOf("M")).includes("T")) {
          leaderTimePlayed += leaderISO.substring(leaderISO.indexOf("M")-1, leaderISO.indexOf("M"));
          leaderTimePlayed += "m";
        } else {
          leaderTimePlayed += leaderISO.substring(leaderISO.indexOf("M")-2, leaderISO.indexOf("M"));
          leaderTimePlayed += "m";
        }
      }

      //get games information
      var leaderGamesPlayed = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[favoriteLeader].TotalMatchesStarted;
      var leaderGamesWon = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[favoriteLeader].TotalMatchesWon;
      var leaderWinPercent = helperFunctions.precisionRound((leaderGamesWon / leaderGamesPlayed) * 100, 2);
      var leaderPowersUsed = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[favoriteLeader].TotalLeaderPowersCast;
      if(favoriteLeader == "Lekgolo") {
        favoriteLeader = "Colony"
      }

      //create leader message
      var leaderMessage = "Time played: "+ leaderTimePlayed +"\n";
      leaderMessage += "Games played: "+ leaderGamesPlayed +"\n";
      leaderMessage += "Games won: "+ leaderGamesWon +"\n";
      leaderMessage += "Win percentage: "+ leaderWinPercent +"%\n";
      leaderMessage += "Leader powers used: "+ leaderPowersUsed;

      //get data for units section
      var unitsBuilt = parsedData.MatchmakingSummary.SocialPlaylistStats[index].TotalUnitsBuilt;
      var unitsLost = parsedData.MatchmakingSummary.SocialPlaylistStats[index].TotalUnitsLost;
      var unitsDestroyed = parsedData.MatchmakingSummary.SocialPlaylistStats[index].TotalUnitsDestroyed;
      if(unitsLost != 0) {
        var unitsKD = helperFunctions.precisionRound((unitsDestroyed / unitsLost), 2);
      } else {
        var unitsKD = "Infinity";
      }

      //create units message
      var unitsMessage = "Units built: "+ unitsBuilt +"\n";
      unitsMessage += "Units lost: "+ unitsLost +"\n";
      unitsMessage += "Units destroyed: "+ unitsDestroyed +"\n";
      unitsMessage += "Units K/D ratio: "+ unitsKD;

      //check if bot has permission to embed links
      if(!eventVariables.guild.me.permissionsIn(eventVariables.channel).has("EMBED_LINKS")) {
        eventVariables.channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", eventVariables.userID));
        return(1);
      }

      //send embedded message with stats
      eventVariables.channel.send({ embed: {
        author: {
          name: "X Team War Stats for " + gamertag
        },
        color: eventVariables.embedcolor,
        thumbnail: {
          url: "attachment://leader.png",
          height: 1920 * .01,
          width: 1452 * .01
        },
        fields: [
          {
            name: "Games",
            value: gamesMessage,
            inline: true
          },
          {
            name: "Favorite Leader: " + favoriteLeader,
            value: leaderMessage,
            inline: true
          },
          {
            name: "Units",
            value: unitsMessage,
            inline: true
          }
        ]
      }, files: [
        {
          attachment: util.format("./assets/leaderpictures/%s.png", favoriteLeader),
          name: "leader.png"
        }
      ]});
    });
  });
}

module.exports.getTeamWar = getTeamWar;
