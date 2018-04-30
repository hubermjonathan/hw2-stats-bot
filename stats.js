/************************************
halo wars 2 stats bot
provides player stats for halo wars 2
by jon huber
************************************/

/*
TODO:
  look for ways to break bot
  add build order command
*/

//setup variables
const discord = require("discord.js"); //discord.js api
const auth = require("./auth.json"); //token file for discord
const fs = require("fs"); //file writing
const util = require("util"); //string formatting
const http = require("https"); //api access
const helperFunctions = require("./functions/helperFunctions"); //helper functions file
const rankedFunctions = require("./functions/rankedFunctions"); //ranked functions file
const unrankedFunctions = require("./functions/unrankedFunctions"); //unranked functions file
const leadersFunctions = require("./functions/leadersFunctions"); //leaders functions file
const buildFunctions = require("./functions/buildFunctions"); //leaders functions file

//create bot, login, and set game
const client = new discord.Client();
client.login(auth.token);
client.on("ready", () => {
  var amtServers = client.guilds.size;
  client.user.setActivity(util.format(".help on %d servers", amtServers));
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
  }

  //update games message
  amtServers = client.guilds.size;
  client.user.setActivity(util.format(".help on %d servers", amtServers));

  //event variables
  const eventVariables = {
    channel: message.channel,
    channelID: message.channel.id,
    guild: message.guild,
    guildID: message.guild.id,
    user: message.author,
    userID: message.author.id,
    member: message.member,
    embedcolor: 39423
  };
  const fileNameUser = util.format("./usersettings/%s.json", eventVariables.userID);
  var usersettings = require(fileNameUser);



  //commands section
  if(message.content.substring(0, 1) == ".") {
    //command variables
    var args = message.content.substring(1).split(" ");
    var command = args[0];
    args = args.splice(1);

    //determine the command
    switch(command) {
      //command: ping
      case "ping":
        eventVariables.channel.send("pong.");
      break;

      //command: help
      case "h":
      case "help":
        //create help message
        var helpMessage = "**help** (h): shows this list\n";
        helpMessage += "usage: .help\n\n";
        helpMessage += "**link** (l): links your gamertag to your discord account so you don't have to type it to get stats\n";
        helpMessage += "usage: .link <gamertag>\n\n";
        helpMessage += "**unranked** (ur): shows team war stats for a given player\n";
        helpMessage += "usage: .unranked <teamwar> <gamertag>\n\n";
        helpMessage += "**ranked** (r): shows ranked stats for a given player\n";
        helpMessage += "usage: .ranked <1x/3x/2/3/overall> <gamertag>\n\n";
        helpMessage += "**leaders**: shows most played leaders in team war for a given player\n";
        helpMessage += "usage: .leaders <gamertag>\n\n";
        helpMessage += "**lastbuild**: shows the first 5 minutes of the build order of the last game for a given player\n";
        helpMessage += "usage: .lastbuild <gamertag>";

        //check if bot has permission to embed links
        if(!eventVariables.guild.me.permissionsIn(eventVariables.channel).has("EMBED_LINKS")) {
          eventVariables.channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", eventVariables.userID));
          return(1);
        }

        //send embedded message with help
        eventVariables.channel.send({ embed: {
          author: {
            name: "Prefix for commands: '.'"
          },
          color: eventVariables.embedcolor,
          fields: [
            {
              name: "Commands",
              value: helpMessage,
              inline: false
            }
          ]
        }});
      break;

      //command: link
      case "l":
      case "link":
        //check for correct arguments
        if(args[0] == null) {
          eventVariables.channel.send(util.format("<@!%s>, please provide a gamertag to link.", eventVariables.userID));
          return(1);
        }

        //get gamertag to store
        let gamertagToStore;
        if(command == "link") {
          gamertagToStore = message.content.substring(6);
        } else if(command == "l") {
          gamertagToStore = message.content.substring(3);
        }

        //check for correct argument
        if(gamertagToStore.length > 15) {
          eventVariables.channel.send(util.format("<@!%s>, that gamertag is too long.", eventVariables.userID));
          return(1);
        }

        //change gamertag in user settings
        usersettings.gamertag = gamertagToStore;
        fs.writeFileSync(fileNameUser, JSON.stringify(usersettings, null, 2));

        //send confirmation message
        eventVariables.channel.send(util.format("<@!%s>, your gamertag has been set to '%s'.", eventVariables.userID, gamertagToStore));
      break;

      //command: stats
      case "ur":
      case "unranked":
        //get playlist
        var playlistUnranked = args[0];
        args = args.splice(1);

        //check for incorrecct playlist
        if(playlistUnranked == null) {
          eventVariables.channel.send(util.format("<@!%s>, usage: .unranked <teamwar> <gamertag>", eventVariables.userID));
          return(1);
        } else if(playlistUnranked.toUpperCase() != "TEAMWAR") {
          eventVariables.channel.send(util.format("<@!%s>, usage: .unranked <teamwar> <gamertag>", eventVariables.userID));
          return(1);
        }

        //check for non-linked gamertag
        if(args[0] == null && usersettings.gamertag == null) {
          eventVariables.channel.send(util.format("<@!%s>, use .link <gamertag> to link your gamertag to your discord.", eventVariables.userID));
          return(1);
        }

        //get gamertag
        let gamertagUnranked;
        if(args[0] == null) {
          gamertagUnranked = usersettings.gamertag;
        } else {
          gamertagUnranked = args.join(" ");
        }

        //check for correct argument
        if(gamertagUnranked.length > 15) {
          eventVariables.channel.send(util.format("<@!%s>, that gamertag is too long.", eventVariables.userID));
          return(1);
        }

        //format gamertags with spaces
        let gamertagUnrankedFormatted = gamertagUnranked.replace(/ /g, "%20");

        //call unranked function
        if(playlistUnranked.toUpperCase() == "TEAMWAR") {
          //information to connect to haloapi
          const optionsTeamWar = {
            hostname: "www.haloapi.com",
            path: util.format("/stats/hw2/players/%s/stats?", gamertagUnrankedFormatted),
            headers: {
              "Ocp-Apim-Subscription-Key": auth.key
            }
          };

          //print data from api
          unrankedFunctions.getTeamWar(optionsTeamWar, eventVariables, gamertagUnranked);
        }
      break;

      //command: ranked
      case "r":
      case "ranked":
        //get playlist
        var playlistRanked = args[0];
        args = args.splice(1);

        //check for incorrecct playlist
        if(playlistRanked == null) {
          eventVariables.channel.send(util.format("<@!%s>, usage: .ranked <1x/3x/2/3/overall> <gamertag>", eventVariables.userID));
          return(1);
        } else if(playlistRanked.toUpperCase() != "1X" && playlistRanked.toUpperCase() != "3X" && playlistRanked.toUpperCase() != "2" && playlistRanked.toUpperCase() != "3" && playlistRanked.toUpperCase() != "OVERALL") {
          eventVariables.channel.send(util.format("<@!%s>, usage: .ranked <1x/3x/2/3/overall> <gamertag>", eventVariables.userID));
          return(1);
        }

        //check for non-linked gamertag
        if(args[0] == null && usersettings.gamertag == null) {
          eventVariables.channel.send(util.format("<@!%s>, use .link <gamertag> to link your gamertag to your discord.", eventVariables.userID));
          return(1);
        }

        //get gamertag
        let gamertagRanked;
        if(args[0] == null) {
          gamertagRanked = usersettings.gamertag;
        } else {
          gamertagRanked = args.join(" ");
        }

        //check for correct argument
        if(gamertagRanked.length > 15) {
          eventVariables.channel.send(util.format("<@!%s>, that gamertag is too long.", eventVariables.userID));
          return(1);
        }

        //format gamertags with spaces
        let gamertagRankedFormatted = gamertagRanked.replace(/ /g, "%20");

        //call ranked function
        //information to connect to haloapi
        const optionsRanked = {
          hostname: "www.haloapi.com",
          path: util.format("/stats/hw2/players/%s/stats/seasons/current", gamertagRankedFormatted),
          headers: {
            "Ocp-Apim-Subscription-Key": auth.key
          }
        };
        if(playlistRanked.toUpperCase() == "1X") {
          //print data from api
          rankedFunctions.get1X(optionsRanked, eventVariables, gamertagRanked, gamertagRankedFormatted);
        } else if(playlistRanked.toUpperCase() == "3X") {
          //print data from api
          rankedFunctions.get3X(optionsRanked, eventVariables, gamertagRanked, gamertagRankedFormatted);
        } else if(playlistRanked.toUpperCase() == "2") {
          //print data from api
          rankedFunctions.get2(optionsRanked, eventVariables, gamertagRanked, gamertagRankedFormatted);
        } else if(playlistRanked.toUpperCase() == "3") {
          //print data from api
          rankedFunctions.get3(optionsRanked, eventVariables, gamertagRanked, gamertagRankedFormatted);
        } else if(playlistRanked.toUpperCase() == "OVERALL") {
          //print data from api
          rankedFunctions.getOverall(optionsRanked, eventVariables, gamertagRanked, gamertagRankedFormatted);
        }
      break;

      //command: leaders
      case "leaders":
        //check for correct arguments
        if(args[0] == null && usersettings.gamertag == null) {
          eventVariables.channel.send(util.format("<@!%s>, use .link <gamertag> to link your gamertag to your discord.", eventVariables.userID));
          return(1);
        }

        //get gamertag
        let gamertagLeaders;
        if(args[0] == null) {
          gamertagLeaders = usersettings.gamertag;
        } else {
          gamertagLeaders = args.join(" ");
        }

        //check for correct argument
        if(gamertagLeaders.length > 15) {
          eventVariables.channel.send(util.format("<@!%s>, that gamertag is too long.", eventVariables.userID));
          return(1);
        }

        //format gamertags with spaces
        let gamertagLeadersFormatted = gamertagLeaders.replace(/ /g, "%20");

        //information to connect to haloapi
        const optionsTop3 = {
          hostname: "www.haloapi.com",
          path: util.format("/stats/hw2/players/%s/stats?", gamertagLeadersFormatted),
          headers: {
            "Ocp-Apim-Subscription-Key": auth.key
          }
        };

        //print data from api
        leadersFunctions.getTop3(optionsTop3, eventVariables, gamertagLeaders, gamertagLeadersFormatted);
      break;

      case "lastbuild":
        //check for correct arguments
        if(args[0] == null && usersettings.gamertag == null) {
          eventVariables.channel.send(util.format("<@!%s>, use .link <gamertag> to link your gamertag to your discord.", eventVariables.userID));
          return(1);
        }

        //get gamertag
        let gamertagBuild;
        if(args[0] == null) {
          gamertagBuild = usersettings.gamertag;
        } else {
          gamertagBuild = args.join(" ");
        }

        //check for correct argument
        if(gamertagBuild.length > 15) {
          eventVariables.channel.send(util.format("<@!%s>, that gamertag is too long.", eventVariables.userID));
          return(1);
        }

        //format gamertags with spaces
        let gamertagBuildFormatted = gamertagBuild.replace(/ /g, "%20");

        //print data from api
        buildFunctions.getLastBuild(eventVariables, gamertagBuild, gamertagBuildFormatted);
      break;

      //no command
      default:
        eventVariables.channel.send(util.format("<@!%s>, that is not a valid command.", eventVariables.userID));
        return(1);
      break;

    }

  }

});
