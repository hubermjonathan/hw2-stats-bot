/************************************
halo wars 2 stats bot
provides player stats for halo wars 2
by jon huber
************************************/

/*
TODO:
  look for ways to break program
  add ranked stats
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
        helpMessage += "usage: " + serversettings.prefix + "stats [gamertag]";

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
            let timePlayed;
            if(timeISO.includes("H")) {

              timePlayed = timeISO.substring(timeISO.indexOf("T")+1, timeISO.indexOf("H"));
              timePlayed += "h ";
              timePlayed += timeISO.substring(timeISO.indexOf("H")+1, timeISO.indexOf("M"));
              timePlayed += "m";

            } else {

              timePlayed = timeISO.substring(timeISO.indexOf("T")+1, timeISO.indexOf("M"));
              timePlayed += "m"

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
            let leaderTimePlayed;
            if(leaderISO.includes("H")) {

              leaderTimePlayed = leaderISO.substring(leaderISO.indexOf("T")+1, leaderISO.indexOf("H"));
              leaderTimePlayed += "h ";
              leaderTimePlayed += leaderISO.substring(leaderISO.indexOf("H")+1, leaderISO.indexOf("M"));
              leaderTimePlayed += "m";

            } else {

              leaderTimePlayed = leaderISO.substring(leaderISO.indexOf("T")+1, leaderISO.indexOf("M"));
              leaderTimePlayed += "m";

            }
            var leaderGamesPlayed = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[favoriteLeader].TotalMatchesStarted;
            var leaderGamesWon = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[favoriteLeader].TotalMatchesWon;
            var leaderWinPercent = functions.round((leaderGamesWon / leaderGamesPlayed) * 100, 2);
            var leaderPowersUsed = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[favoriteLeader].TotalLeaderPowersCast;

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
            var unitsKD = functions.round((unitsDestroyed / unitsLost), 2);

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
                attachment: util.format("./leaderpictures/%s.png", favoriteLeader),
                name: "leader.png"
              }

            ]});
            console.log(util.format("Sent stats message for %s in %s.", gamertag, guild.name));

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
