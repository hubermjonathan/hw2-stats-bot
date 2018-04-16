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
const apiauth = require("./apikey.json"); //api key file
const fs = require("fs"); //file writing
const util = require("util"); //string formatting
const functions = require("./functions"); //helper functions file
const http = require("https"); //api access

//create bot, login, and set game
const client = new discord.Client();
client.login(auth.token);
client.on("ready", () => {
  console.log(util.format("Logged in and running as %s.", client.user.username));
  client.user.setActivity("Halo Wars 2");
});

//create server-specific settings file on server join
client.on("guildCreate", guild => {
  //check if file already exists
  if(!fs.existsSync(util.format("./serversettings/%s.json", guild.id))) {
    //write default values
    let defaultServerValues = {
      serverName: guild.name,
      prefix: "!"
    }
    let jsonServerValues = JSON.stringify(defaultServerValues, null, 2);
    fs.writeFileSync(util.format("./serversettings/%s.json", guild.id), jsonServerValues);
    console.log(util.format("Server settings created for %s.", guild.name));
  }
});

//execute user given commands
client.on("message", message => {
  //ensure that the message came from a server and not a direct message
  if(message.guild == null) return(1);

  //ensure that server settings exist for current server
  client.emit("guildCreate", message.guild);

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

  //relevant variables
  const channel = message.channel;
  const channelID = channel.id;
  const guild = message.guild;
  const guildID = guild.id;
  const user = message.author;
  const userID = user.id;
  const fileNameServer = util.format("./serversettings/%s.json", guildID);
  const fileNameUser = util.format("./usersettings/%s.json", userID);
  var serversettings = require(fileNameServer);
  var usersettings = require(fileNameUser);

  if(message.content.substring(0, 1) == serversettings.prefix) {
    //split up command and arguments
    var args = message.content.substring(1).split(" ");
    var command = args[0];
    args = args.splice(1);

    //determine the command
    switch(command) {
      //command: prefix (owner only)
      case "p":
      case "prefix":
        //check for correct permission
        if(!functions.checkIfOwner(user, guild)) {
          //send error message for no permission
          channel.send(util.format("<@!%s>, you are not permitted to use this command.", userID));
          return(1);
        }

        //check for correct argument
        if(args[0] == null) {
          //send error message for no arguments
          channel.send(util.format("<@!%s>, that is not a valid argument.", userID));
          return(1);
        }

        //change prefix in server settings
        var newPrefix = args[0].substring(0,1);
        serversettings.prefix = newPrefix;
        fs.writeFileSync(fileNameServer, JSON.stringify(serversettings, null, 2));

        //send confirmation message
        channel.send(util.format("<@!%s>, the prefix has been set to '%s'.", userID, newPrefix));
        console.log(util.format("Changed prefix to '%s'.", newPrefix));
      break;

      //command: ping
      case "ping":
        channel.send("pong"+serversettings.prefix);
      break;

      //command: help
      case "h":
      case "help":
        //create help message
        var helpMessage = "**help** (h): shows this list\n";
        helpMessage += "usage: " + serversettings.prefix + "help\n\n";
        helpMessage += "**prefix** (p): changes the command prefix, owner only\n";
        helpMessage += "usage: " + serversettings.prefix + "prefix [newPrefix]\n\n";
        helpMessage += "**link** (l): links your gamertag to your discord account so you don't have to type it to get stats\n";
        helpMessage += "usage: " + serversettings.prefix + "link [gamertag]\n\n";
        helpMessage += "**stats** (s): shows halo wars 2 team war stats for a given player\n";
        helpMessage += "usage: " + serversettings.prefix + "stats [gamertag]\n\n";
        helpMessage += "**ranked** (r): shows halo wars 2 ranked stats for a given player\n";
        helpMessage += "usage: " + serversettings.prefix + "ranked [gamertag]";

        //check if bot has permission to embed links
        if(!guild.me.permissionsIn(channel).has("EMBED_LINKS")) {
          //send error message for no arguments
          channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", userID));
          return(1);
        }

        //send embedded message with help
        channel.send({ embed: {
          author: {
            name: "Prefix for commands: '" + serversettings.prefix +"'"
          },
          color: 16711680,
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
          //send error message for no arguments
          channel.send(util.format("<@!%s>, that is not a valid argument.", userID));
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
          channel.send(util.format("<@!%s>, that is not a valid argument.", userID));
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
          //send error message for no arguments
          channel.send(util.format("<@!%s>, that is not a valid gamertag.", userID));
          return(1);
        }

        //format gamertags with spaces
        var gamertagF = gamertag.replace(/ /g, "%20");

        //information to connect to haloapi
        const options = {
          hostname: "www.haloapi.com",
          path: util.format("/stats/hw2/players/%s/stats?", gamertagF),
          headers: {
            "Ocp-Apim-Subscription-Key": apiauth.key
          }
        };

        //get request
        http.get(options, (res) => {
          //check for valid gamertag
          if (res.statusCode == 404) {
            //send error message for invalid gamertag
            channel.send(util.format("<@!%s>, that is not a valid gamertag.", userID));
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
            if(parsedData.MatchmakingSummary.SocialPlaylistStats.length == 0) {
              //send error message for no arguments
              channel.send(util.format("<@!%s>, %s has not played any games.", userID, gamertag));
              return(1);
            }

            //find correct index
            var index = -1;
            for(var i = 0; i < parsedData.MatchmakingSummary.SocialPlaylistStats.length; i++) {
              //team war id
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
            var winPercent = functions.round((gamesWon / gamesPlayed) * 100, 2);

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
            var leaderWinPercent = functions.round((leaderGamesWon / leaderGamesPlayed) * 100, 2);
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
              var unitsKD = functions.round((unitsDestroyed / unitsLost), 2);
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
              //send error message for no arguments
              channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", userID));
              return(1);
            }

            //send embedded message with stats
            channel.send({ embed: {
              author: {
                name: "Team War Stats for " + gamertag
              },
              color: 16711680,
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
          channel.send(util.format("<@!%s>, that is not a valid argument.", userID));
          return(1);
        }

        //get gamertag
        let rgamertag;
        if(args[0] == null) {
          rgamertag = usersettings.gamertag;
        } else if(command == "ranked") {
          rgamertag = message.content.substring(7);
        } else if(command == "r") {
          rgamertag = message.content.substring(3);
        }

        //check for correct argument
        if(rgamertag.length > 15) {
          //send error message for no arguments
          channel.send(util.format("<@!%s>, that is not a valid gamertag.", userID));
          return(1);
        }

        //format gamertags with spaces
        var rgamertagF = rgamertag.replace(/ /g, "%20");

        //information to connect to haloapi
        const roptions = {
          hostname: "www.haloapi.com",
          path: util.format("/stats/hw2/players/%s/stats/seasons/current", rgamertagF),
          headers: {
            "Ocp-Apim-Subscription-Key": apiauth.key
          }
        };

        //get request
        http.get(roptions, (res) => {
          //check for valid gamertag
          if (res.statusCode == 404) {
            //send error message for invalid gamertag
            channel.send(util.format("<@!%s>, that is not a valid gamertag.", userID));
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
              //send error message for no arguments
              channel.send(util.format("<@!%s>, %s has not played any games.", userID, rgamertag));
              return(1);
            }

            //get data for 1v1 war section

            //find correct index
            var onesIndex = -1;
            for(var i = 0; i < parsedData.RankedPlaylistStats.length; i++) {
              //team war id
              if(parsedData.RankedPlaylistStats[i].PlaylistId == "548d864e-8666-430e-9140-8dd2ad8fbfcd") {
                onesIndex = i;
                break;
              }
            }

            //check if user has not played games
            if(parsedData.RankedPlaylistStats[onesIndex] == undefined) {
              var onesRank = "Unranked";
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
                var onesRankPercent = (parsedData.RankedPlaylistStats[onesIndex].TotalMatchesCompleted / 10) * 100;
                var onesCsr = 0;
              } else {
                var onesRankNumber = parsedData.RankedPlaylistStats[onesIndex].HighestCsr.Designation;
                var ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Onyx", "Champion"];
                var onesRank = ranks[onesRankNumber-1];
                var onesTier = parsedData.RankedPlaylistStats[onesIndex].HighestCsr.Tier;
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
              var onesWinPercent = functions.round((onesGamesWon / onesGamesPlayed) * 100, 2);
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
            var onesMessage = "Rank: "+ onesRank + " (" + onesRankPercent + "%)" +"\n";
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
              //team war id
              if(parsedData.RankedPlaylistStats[i].PlaylistId == "4a2cedcc-9098-4728-886f-60649896278d") {
                threesIndex = i;
                break;
              }
            }

            //check if user has not played games
            if(parsedData.RankedPlaylistStats[threesIndex] == undefined) {
              var threesRank = "Unranked";
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
                var threesRankPercent = (parsedData.RankedPlaylistStats[threesIndex].TotalMatchesCompleted / 10) * 100;
                var threesCsr = 0;
              } else {
                var threesRankNumber = parsedData.RankedPlaylistStats[threesIndex].HighestCsr.Designation;
                var ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Onyx", "Champion"];
                var threesRank = ranks[threesRankNumber-1];
                var threesTier = parsedData.RankedPlaylistStats[threesIndex].HighestCsr.Tier;
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
              var threesWinPercent = functions.round((threesGamesWon / threesGamesPlayed) * 100, 2);
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
            var threesMessage = "Rank: "+ threesRank + " (" + threesRankPercent + "%)" +"\n";
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
              //send error message for no arguments
              channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", userID));
              return(1);
            }

            //send embedded message with stats
            channel.send({ embed: {
              author: {
                name: "Ranked Stats for " + rgamertag
              },
              color: 16711680,
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
            console.log(util.format("Sent stats message for %s in %s.", rgamertag, guild.name));
          });
        });
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
