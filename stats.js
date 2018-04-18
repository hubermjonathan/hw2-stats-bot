/************************************
halo wars 2 stats bot
provides player stats for halo wars 2
by jon huber
************************************/

/*
TODO:
  look for ways to break program
*/

//setup variables
const discord = require("discord.js"); //discord.js api
const auth = require("./auth.json"); //token file for discord
const fs = require("fs"); //file writing
const util = require("util"); //string formatting
const http = require("https"); //api access

//precision rounding function
function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

//array shuffling function
function arrayShuffle(array) {
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

//create bot, login, and set game
const client = new discord.Client();
client.login(auth.token);
client.on("ready", () => {
  console.log(util.format("Logged in and running as %s.", client.user.username));
  client.user.setActivity("~help");
});

//execute user given commands
client.on("message", message => {
  //ensure that the message came from a server and not a direct message
  if(message.guild == null) return(1);

  //esnure that message author is not the bot
  if(message.author.bot) return(1);

  //ensure that user settings exist for message author
  if(!fs.existsSync(util.format("./usersettings/%s.json", message.author.id))) {
    let defaultUserValues = {
      userName: message.author.username,
      gamertag: null
    }
    let jsonUserValues = JSON.stringify(defaultUserValues, null, 2);
    fs.writeFileSync(util.format("./usersettings/%s.json", message.author.id), jsonUserValues);
    console.log(util.format("User settings created for %s.", message.author.username));
  }

  //event variables
  const embedcolor = 39423;
  const channel = message.channel;
  const channelID = channel.id;
  const guild = message.guild;
  const guildID = guild.id;
  const user = message.author;
  const userID = user.id;
  const member = message.member;
  const fileNameUser = util.format("./usersettings/%s.json", userID);
  var usersettings = require(fileNameUser);

  //commands section
  if(message.content.substring(0, 1) == "!") {
    //command variables
    var args = message.content.substring(1).split(" ");
    var command = args[0];
    args = args.splice(1);

    //determine the command
    switch(command) {
      //command: game
      case "game":
        if(userID == "196141424318611457") {
          client.user.setActivity("~help");
          console.log("Reset bot game");
        }
      break;

      //command: ping
      case "ping":
        channel.send("pong~");
        console.log(util.format("Sent ping message to %s.", guild.name));
      break;

      //command: help
      case "h":
      case "help":
        //create help message
        var helpMessage = "**help** (h): shows this list\n";
        helpMessage += "usage: ~help\n\n";
        helpMessage += "**link** (l): links your gamertag to your discord account so you don't have to type it to get stats\n";
        helpMessage += "usage: ~link <gamertag>\n\n";
        helpMessage += "**stats** (s): shows halo wars 2 team war stats for a given player\n";
        helpMessage += "usage: ~stats <gamertag>\n\n";
        helpMessage += "**ranked** (r): shows halo wars 2 ranked stats for a given player\n";
        helpMessage += "usage: ~ranked <gamertag>\n\n";
        helpMessage += "**createteams** (ct): create random teams with users in a voice channel\n";
        helpMessage += "usage: ~createteams";

        //check if bot has permission to embed links
        if(!guild.me.permissionsIn(channel).has("EMBED_LINKS")) {
          //send error message for no permissions
          channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", userID));
          console.log(util.format("Sent permissions error message to %s.", guild.name));
          return(1);
        }

        //send embedded message with help
        channel.send({ embed: {
          author: {
            name: "Prefix for commands: '~'"
          },
          color: embedcolor,
          fields: [
            {
              name: "Commands",
              value: helpMessage,
              inline: false
            }
          ]
        }});
        console.log(util.format("Sent help message to %s.", guild.name));
      break;

      //command: link
      case "l":
      case "link":
        //check for correct arguments
        if(args[0] == null) {
          //send error message for no gamertag
          channel.send(util.format("<@!%s>, please provide a gamertag to link.", userID));
          console.log(util.format("Sent link error message to %s.", guild.name));
          return(1);
        }

        //get gamertag to store
        let gamertagToStore;
        if(command == "link") {
          gamertagToStore = message.content.substring(6);
        } else if(command == "l") {
          gamertagToStore = message.content.substring(3);
        }

        //change gamertag in user settings
        usersettings.gamertag = gamertagToStore;
        fs.writeFileSync(fileNameUser, JSON.stringify(usersettings, null, 2));

        //send confirmation message
        channel.send(util.format("<@!%s>, your gamertag has been set to '%s'.", userID, gamertagToStore));
        console.log(util.format("Changed %s's gamertag to '%s'", usersettings.userName, gamertagToStore));
      break;

      //command: stats
      case "s":
      case "stats":
        //check for correct arguments
        if(args[0] == null && usersettings.gamertag == null) {
          //send error message for no arguments
          channel.send(util.format("<@!%s>, use ~link <gamertag> to link your gamertag to your discord.", userID));
          console.log(util.format("Sent stats error message to %s.", guild.name));
          return(1);
        }

        //get gamertag
        let gamertag;
        if(args[0] == null) {
          gamertag = usersettings.gamertag;
        } else if(command == "stats") {
          gamertag = message.content.substring(7);
        } else if(command == "s") {
          gamertag = message.content.substring(3);
        }

        //check for correct argument
        if(gamertag.length > 15) {
          //send error message for invalid argument
          channel.send(util.format("<@!%s>, that gamertag is too long.", userID));
          console.log(util.format("Sent stats error message to %s.", guild.name));
          return(1);
        }

        //format gamertags with spaces
        let gamertagFormatted = gamertag.replace(/ /g, "%20");

        //information to connect to haloapi
        const options = {
          hostname: "www.haloapi.com",
          path: util.format("/stats/hw2/players/%s/stats?", gamertagFormatted),
          headers: {
            "Ocp-Apim-Subscription-Key": auth.key
          }
        };

        //get request
        http.get(options, (res) => {
          //check for valid gamertag
          if (res.statusCode == 404) {
            //send error message for invalid gamertag
            channel.send(util.format("<@!%s>, that gamertag does not exist.", userID));
            console.log(util.format("Sent stats error message to %s.", guild.name));
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
              //send error message for invalid gamertag
              channel.send(util.format("<@!%s>, %s has not played any games.", userID, gamertag));
              console.log(util.format("Sent stats error message to %s.", guild.name));
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
            var gamesPlayed = parsedData.MatchmakingSummary.SocialPlaylistStats[index].TotalMatchesStarted;
            var gamesWon = parsedData.MatchmakingSummary.SocialPlaylistStats[index].TotalMatchesWon;
            var gamesLost = parsedData.MatchmakingSummary.SocialPlaylistStats[index].TotalMatchesLost;
            var winPercent = precisionRound((gamesWon / gamesPlayed) * 100, 2);

            //create games message
            var gamesMessage = "Time played: "+ timePlayed +"\n";
            gamesMessage += "Games played: "+ gamesPlayed +"\n";
            gamesMessage += "Games won: "+ gamesWon +"\n";
            gamesMessage += "Games lost: "+ gamesLost +"\n";
            gamesMessage += "Win percentage: "+ winPercent +"%";

            //get data for leader section
            var max = -1;
            var favoriteLeader = "";
            for(var leader in parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats) {
              if(parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[leader].TotalMatchesStarted > max) {
                max = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[leader].TotalMatchesStarted;
                favoriteLeader = leader;
              }
            }
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
            var leaderGamesPlayed = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[favoriteLeader].TotalMatchesStarted;
            var leaderGamesWon = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[favoriteLeader].TotalMatchesWon;
            var leaderWinPercent = precisionRound((leaderGamesWon / leaderGamesPlayed) * 100, 2);
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
              var unitsKD = precisionRound((unitsDestroyed / unitsLost), 2);
            } else {
              var unitsKD = "Infinity";
            }

            //create units message
            var unitsMessage = "Units built: "+ unitsBuilt +"\n";
            unitsMessage += "Units lost: "+ unitsLost +"\n";
            unitsMessage += "Units destroyed: "+ unitsDestroyed +"\n";
            unitsMessage += "Units K/D ratio: "+ unitsKD;

            //check if bot has permission to embed links
            if(!guild.me.permissionsIn(channel).has("EMBED_LINKS")) {
              //send error message for no permissions
              channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", userID));
              console.log(util.format("Sent permissions error message to %s.", guild.name));
              return(1);
            }

            //send embedded message with stats
            channel.send({ embed: {
              author: {
                name: "Team War Stats for " + gamertag
              },
              color: embedcolor,
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
            console.log(util.format("Sent stats message for %s in %s.", gamertag, guild.name));
          });
        });
      break;

      //command: stats
      case "r":
      case "ranked":
        //check for correct arguments
        if(args[0] == null && usersettings.gamertag == null) {
          //send error message for no arguments
          channel.send(util.format("<@!%s>, use ~link <gamertag> to link your gamertag to your discord.", userID));
          console.log(util.format("Sent ranked error message to %s.", guild.name));
          return(1);
        }

        //get gamertag
        let rankedGamertag;
        if(args[0] == null) {
          rankedGamertag = usersettings.gamertag;
        } else if(command == "ranked") {
          rankedGamertag = message.content.substring(7);
        } else if(command == "r") {
          rankedGamertag = message.content.substring(3);
        }

        //check for correct argument
        if(rankedGamertag.length > 15) {
          //send error message for invalid gamertag
          channel.send(util.format("<@!%s>, that gamertag is too long.", userID));
          console.log(util.format("Sent ranked error message to %s.", guild.name));
          return(1);
        }

        //format gamertags with spaces
        let rankedGamertagFormatted = rankedGamertag.replace(/ /g, "%20");

        //information to connect to haloapi
        const roptions = {
          hostname: "www.haloapi.com",
          path: util.format("/stats/hw2/players/%s/stats/seasons/current", rankedGamertagFormatted),
          headers: {
            "Ocp-Apim-Subscription-Key": auth.key
          }
        };

        //get request
        http.get(roptions, (res) => {
          //check for valid gamertag
          if (res.statusCode == 404) {
            //send error message for invalid gamertag
            channel.send(util.format("<@!%s>, that gamertag does not exist.", userID));
            console.log(util.format("Sent ranked error message to %s.", guild.name));
            return(1);
          }

          //get user stats
          var rawData = "";
          res.on("data", (chunk) => { rawData += chunk; });

          //create and send message when all data is received
          res.on("end", () => {
            //parse data
            const parsedData = JSON.parse(rawData);
            //check if user has not played games
            if(parsedData.RankedPlaylistStats.length == 0) {
              //send error message for invalid gamertag
              channel.send(util.format("<@!%s>, %s has not played any games.", userID, rankedGamertag));
              console.log(util.format("Sent ranked error message to %s.", guild.name));
              return(1);
            }

            //get data for 1v1 war section

            //find correct index
            var onesIndex = -1;
            for(var i = 0; i < parsedData.RankedPlaylistStats.length; i++) {
              //find ranked ones id
              if(parsedData.RankedPlaylistStats[i].PlaylistId == "548d864e-8666-430e-9140-8dd2ad8fbfcd") {
                onesIndex = i;
                break;
              }
            }

            //check if user has not played games
            if(parsedData.RankedPlaylistStats[onesIndex] == undefined) {
              var onesRank = "Unranked";
              var onesTier = "";
              var onesRankNumber = 0;
              var onesRankPercent = 0;
              var onesCsr = 0;
              var onesTimePlayed = "0h 0m";
              var onesGamesPlayed = 0;
              var onesGamesWon = 0;
              var onesGamesLost = 0;
              var onesWinPercent = 0;
              var onesFavoriteLeader = "None";
            } else {
              if(parsedData.RankedPlaylistStats[onesIndex].HighestCsr == null) {
                var onesRank = "Unranked";
                var onesTier = "";
                var onesRankPercent = (parsedData.RankedPlaylistStats[onesIndex].TotalMatchesCompleted / 10) * 100;
                var onesCsr = 0;
              } else {
                var onesRankNumber = parsedData.RankedPlaylistStats[onesIndex].HighestCsr.Designation;
                var ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Onyx", "Champion"];
                var onesRank = ranks[onesRankNumber-1];
                var onesTier = " "
                onesTier += parsedData.RankedPlaylistStats[onesIndex].HighestCsr.Tier;
                var onesRankPercent = parsedData.RankedPlaylistStats[onesIndex].HighestCsr.PercentToNextTier;
                var onesCsr = parsedData.RankedPlaylistStats[onesIndex].HighestCsr.Raw;
              }
              var onesISO = parsedData.RankedPlaylistStats[onesIndex].TotalTimePlayed;
              var onesTimePlayed = "";
              if(onesISO.includes("D")) {
                onesTimePlayed += onesISO.substring(onesISO.indexOf("P")+1, onesISO.indexOf("D"));
                onesTimePlayed += "d ";
              }
              if(onesISO.includes("H")) {
                onesTimePlayed += onesISO.substring(onesISO.indexOf("T")+1, onesISO.indexOf("H"));
                onesTimePlayed += "h ";
              }
              if(onesISO.includes("M")) {
                if(onesISO.substring(onesISO.indexOf("M")-2, onesISO.indexOf("M")).includes("H") || onesISO.substring(onesISO.indexOf("M")-2, onesISO.indexOf("M")).includes("T")) {
                  onesTimePlayed += onesISO.substring(onesISO.indexOf("M")-1, onesISO.indexOf("M"));
                  onesTimePlayed += "m";
                } else {
                  onesTimePlayed += onesISO.substring(onesISO.indexOf("M")-2, onesISO.indexOf("M"));
                  onesTimePlayed += "m";
                }
              }
              var onesGamesPlayed = parsedData.RankedPlaylistStats[onesIndex].TotalMatchesStarted;
              var onesGamesWon = parsedData.RankedPlaylistStats[onesIndex].TotalMatchesWon;
              var onesGamesLost = parsedData.RankedPlaylistStats[onesIndex].TotalMatchesLost;
              var onesWinPercent = precisionRound((onesGamesWon / onesGamesPlayed) * 100, 2);
              var onesMax = -1;
              var onesFavoriteLeader = "";
              for(var leader in parsedData.RankedPlaylistStats[onesIndex].LeaderStats) {
                if(parsedData.RankedPlaylistStats[onesIndex].LeaderStats[leader].TotalMatchesStarted > onesMax) {
                  onesMax = parsedData.RankedPlaylistStats[onesIndex].LeaderStats[leader].TotalMatchesStarted;
                  onesFavoriteLeader = leader;
                  if(onesFavoriteLeader == "Lekgolo") {
                    onesFavoriteLeader = "Colony"
                  }
                }
              }
            }

            //create 1v1 message
            var onesMessage = "Rank: "+ onesRank + onesTier + " (" + onesRankPercent + "%)" +"\n";
            onesMessage += "Raw CSR: "+ onesCsr +"\n";
            onesMessage += "Time played: "+ onesTimePlayed +"\n";
            onesMessage += "Games played: "+ onesGamesPlayed +"\n";
            onesMessage += "Games won: "+ onesGamesWon +"\n";
            onesMessage += "Games lost: "+ onesGamesLost +"\n";
            onesMessage += "Win percentage: "+ onesWinPercent +"%\n";
            onesMessage += "Favorite leader: "+ onesFavoriteLeader;

            //get data for 3v3 war section

            //find correct index
            var threesIndex = -1;
            for(var i = 0; i < parsedData.RankedPlaylistStats.length; i++) {
              //find ranked threes id
              if(parsedData.RankedPlaylistStats[i].PlaylistId == "4a2cedcc-9098-4728-886f-60649896278d") {
                threesIndex = i;
                break;
              }
            }

            //check if user has not played games
            if(parsedData.RankedPlaylistStats[threesIndex] == undefined) {
              var threesRank = "Unranked";
              var threesTier = "";
              var threesRankNumber = 0;
              var threesRankPercent = 0;
              var threesCsr = 0;
              var threesTimePlayed = "0h 0m";
              var threesGamesPlayed = 0;
              var threesGamesWon = 0;
              var threesGamesLost = 0;
              var threesWinPercent = 0;
              var threesFavoriteLeader = "None";
            } else {
              if(parsedData.RankedPlaylistStats[threesIndex].HighestCsr == null) {
                var threesRank = "Unranked";
                var threesTier = "";
                var threesRankPercent = (parsedData.RankedPlaylistStats[threesIndex].TotalMatchesCompleted / 10) * 100;
                var threesCsr = 0;
              } else {
                var threesRankNumber = parsedData.RankedPlaylistStats[threesIndex].HighestCsr.Designation;
                var ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Onyx", "Champion"];
                var threesRank = ranks[threesRankNumber-1];
                var threesTier = " "
                threesTier += parsedData.RankedPlaylistStats[threesIndex].HighestCsr.Tier;
                var threesRankPercent = parsedData.RankedPlaylistStats[threesIndex].HighestCsr.PercentToNextTier;
                var threesCsr = parsedData.RankedPlaylistStats[threesIndex].HighestCsr.Raw;
              }
              var threesISO = parsedData.RankedPlaylistStats[threesIndex].TotalTimePlayed
              var threesTimePlayed = "";
              if(threesISO.includes("D")) {
                threesTimePlayed += threesISO.substring(threesISO.indexOf("P")+1, threesISO.indexOf("D"));
                threesTimePlayed += "d ";
              }
              if(threesISO.includes("H")) {
                threesTimePlayed += threesISO.substring(threesISO.indexOf("T")+1, threesISO.indexOf("H"));
                threesTimePlayed += "h ";
              }
              if(threesISO.includes("M")) {
                if(threesISO.substring(threesISO.indexOf("M")-2, threesISO.indexOf("M")).includes("H") || threesISO.substring(threesISO.indexOf("M")-2, threesISO.indexOf("M")).includes("T")) {
                  threesTimePlayed += threesISO.substring(threesISO.indexOf("M")-1, threesISO.indexOf("M"));
                  threesTimePlayed += "m";
                } else {
                  threesTimePlayed += threesISO.substring(threesISO.indexOf("M")-2, threesISO.indexOf("M"));
                  threesTimePlayed += "m";
                }
              }
              var threesGamesPlayed = parsedData.RankedPlaylistStats[threesIndex].TotalMatchesStarted;
              var threesGamesWon = parsedData.RankedPlaylistStats[threesIndex].TotalMatchesWon;
              var threesGamesLost = parsedData.RankedPlaylistStats[threesIndex].TotalMatchesLost;
              var threesWinPercent = precisionRound((threesGamesWon / threesGamesPlayed) * 100, 2);
              var threesMax = -1;
              var threesFavoriteLeader = "";
              for(var leader in parsedData.RankedPlaylistStats[threesIndex].LeaderStats) {
                if(parsedData.RankedPlaylistStats[threesIndex].LeaderStats[leader].TotalMatchesStarted > threesMax) {
                  threesMax = parsedData.RankedPlaylistStats[threesIndex].LeaderStats[leader].TotalMatchesStarted;
                  threesFavoriteLeader = leader;
                  if(threesFavoriteLeader == "Lekgolo") {
                    threesFavoriteLeader = "Colony"
                  }
                }
              }
            }

            //create 3v3 message
            var threesMessage = "Rank: "+ threesRank + threesTier + " (" + threesRankPercent + "%)" +"\n";
            threesMessage += "Raw CSR: "+ threesCsr +"\n";
            threesMessage += "Time played: "+ threesTimePlayed +"\n";
            threesMessage += "Games played: "+ threesGamesPlayed +"\n";
            threesMessage += "Games won: "+ threesGamesWon +"\n";
            threesMessage += "Games lost: "+ threesGamesLost +"\n";
            threesMessage += "Win percentage: "+ threesWinPercent +"%\n";
            threesMessage += "Favorite leader: "+ threesFavoriteLeader;

            //get highestDesignation
            var highestDesignation = -1;
            if(onesRankNumber == undefined || threesRankNumber == undefined) {
              highestDesignation = 0;
            } else if(onesRankNumber > highestDesignation) {
              highestDesignation = onesRankNumber;
            } else {
              highestDesignation = threesRankNumber;
            }

            //check if bot has permission to embed links
            if(!guild.me.permissionsIn(channel).has("EMBED_LINKS")) {
              //send error message for no permissions
              channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", userID));
              console.log(util.format("Sent permissions error message to %s.", guild.name));
              return(1);
            }

            //send embedded message with stats
            channel.send({ embed: {
              author: {
                name: "Ranked Stats for " + rankedGamertag
              },
              color: embedcolor,
              thumbnail: {
                url: "attachment://designation.png",
                height: 1920 * .01,
                width: 1452 * .01
              },
              fields: [
                {
                  name: "1v1 War",
                  value: onesMessage,
                  inline: true
                },
                {
                  name: "3v3 War",
                  value: threesMessage,
                  inline: true
                }
              ]

            }, files: [
              {
                attachment: util.format("./assets/designations/%s.png", highestDesignation),
                name: "designation.png"
              }
            ]});
            console.log(util.format("Sent ranked message for %s in %s.", rankedGamertag, guild.name));
          });
        });
      break;

      //command: createteams
      case "ct":
      case "createteams":
        //ensure author is in a voice channel
        if(member.voiceChannel == null) {
          //send error message for invalid channel
          channel.send(util.format("<@!%s>, you must be in a voice channel to use this command.", userID));
          console.log(util.format("Sent createteams error message to %s.", guild.name));
          return(1);
        }

        //get all members of channel
        var channelMembers = member.voiceChannel.members.array();

        //ensure there are at least 2 members in the channel
        if(channelMembers.length < 2) {
          //send error message for invalid channel
          channel.send(util.format("<@!%s>, there must be at least 2 people to create teams.", userID));
          console.log(util.format("Sent createteams error message to %s.", guild.name));
          return(1);
        }

        //sort into team 1
        var team1Members = [];
        for(var i = 0; i < channelMembers.length/2; i++) {
          channelMembers = arrayShuffle(channelMembers);
          team1Members.push(channelMembers.pop());
        }

        //sort into team 2
        var team2Members = [];
        for(var i = 0; i < channelMembers.length; i++) {
          channelMembers = arrayShuffle(channelMembers);
          team2Members.push(channelMembers.pop());
        }

        //create team 1 message
        var team1Message = "";
        for(var i = 0; i < team1Members.length; i++) {
          team1Message += team1Members[i];
          if(i != team1Members.length - 1) {
            team1Message += "\n";
          }
        }

        //create team 2 message
        var team2Message = "";
        for(var i = 0; i < team2Members.length; i++) {
          team2Message += team2Members[i];
          if(i != team2Members.length - 1) {
            team2Message += "\n";
          }
        }

        //check if bot has permission to embed links
        if(!guild.me.permissionsIn(channel).has("EMBED_LINKS")) {
          //send error message for no permissions
          channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", userID));
          console.log(util.format("Sent permissions error message to %s.", guild.name));
          return(1);
        }

        //send embedded message with teams
        channel.send({ embed: {
          author: {
            name: "Teams"
          },
          color: embedcolor,
          fields: [
            {
              name: "Team 1",
              value: team1Message,
              inline: true
            },
            {
              name: "Team 2",
              value: team2Message,
              inline: true
            }
          ]
        }});
        console.log(util.format("Sent createteams message to %s.", guild.name));
      break;

      //no command
      default:
        //send error message for invalid command
        channel.send(util.format("<@!%s>, that is not a valid command.", userID));
        return(1);
      break;

    }

  }

});
