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
const helperFunctions = require("./functions/helperFunctions"); //helper functions file
const rankedFunctions = require("./functions/rankedFunctions"); //ranked functions file
const unrankedFunctions = require("./functions/unrankedFunctions"); //unranked functions file

//create bot, login, and set game
const client = new discord.Client();
client.login(auth.token);
client.on("ready", () => {
  client.user.setActivity("~help");
  var amtServers = client.guilds.size;
  client.user.setActivity(util.format("~help on %d servers", amtServers));
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
  client.user.setActivity(util.format("~help on %d servers", amtServers));

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
        eventVariables.channel.send("pong~");
      break;

      //command: help
      case "h":
      case "help":
        //create help message
        var helpMessage = "**help** (h): shows this list\n";
        helpMessage += "usage: ~help\n\n";
        helpMessage += "**link** (l): links your gamertag to your discord account so you don't have to type it to get stats\n";
        helpMessage += "usage: ~link <gamertag>\n\n";
        helpMessage += "**unranked** (ur): shows team war stats for a given player\n";
        helpMessage += "usage: ~unranked <teamwar> <gamertag>\n\n";
        helpMessage += "**ranked** (r): shows ranked stats for a given player\n";
        helpMessage += "usage: ~ranked <1x/3x/2/3> <gamertag>\n\n";
        helpMessage += "**leaders**: shows most played leaders in team war for a given player\n";
        helpMessage += "usage: ~leaders <gamertag>";

        //check if bot has permission to embed links
        if(!eventVariables.guild.me.permissionsIn(eventVariables.channel).has("EMBED_LINKS")) {
          //send error message for no permissions
          eventVariables.channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", eventVariables.userID));
          return(1);
        }

        //send embedded message with help
        eventVariables.channel.send({ embed: {
          author: {
            name: "Prefix for commands: '~'"
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
          //send error message for no gamertag
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
          //send error message for invalid argument
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
          //send error message for no playlist
          eventVariables.channel.send(util.format("<@!%s>, usage: ~unranked <teamwar> <gamertag>", eventVariables.userID));
          return(1);
        } else if(playlistUnranked.toUpperCase() != "TEAMWAR") {
          //send error message for incorrect playlist
          eventVariables.channel.send(util.format("<@!%s>, usage: ~unranked <teamwar> <gamertag>", eventVariables.userID));
          return(1);
        }

        //check for non-linked gamertag
        if(args[0] == null && usersettings.gamertag == null) {
          //send error message for no arguments
          eventVariables.channel.send(util.format("<@!%s>, use ~link <gamertag> to link your gamertag to your discord.", eventVariables.userID));
          return(1);
        }

        //get gamertag
        let gamertagUnranked;
        if(args[0] == null) {
          gamertagUnranked = usersettings.gamertag;
        } else {
          gamertagUnranked = args[0];
        }

        //check for correct argument
        if(gamertagUnranked.length > 15) {
          //send error message for invalid gamertag
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
          //send error message for no playlist
          eventVariables.channel.send(util.format("<@!%s>, usage: ~ranked <1x/3x/2/3> <gamertag>", eventVariables.userID));
          return(1);
        } else if(playlistRanked.toUpperCase() != "1X" && playlistRanked.toUpperCase() != "3X" && playlistRanked.toUpperCase() != "2" && playlistRanked.toUpperCase() != "3") {
          //send error message for incorrect playlist
          eventVariables.channel.send(util.format("<@!%s>, usage: ~ranked <1x/3x/2/3> <gamertag>", eventVariables.userID));
          return(1);
        }

        //check for non-linked gamertag
        if(args[0] == null && usersettings.gamertag == null) {
          //send error message for no arguments
          eventVariables.channel.send(util.format("<@!%s>, use ~link <gamertag> to link your gamertag to your discord.", eventVariables.userID));
          return(1);
        }

        //get gamertag
        let gamertagRanked;
        if(args[0] == null) {
          gamertagRanked = usersettings.gamertag;
        } else {
          gamertagRanked = args[0];
        }

        //check for correct argument
        if(gamertagRanked.length > 15) {
          //send error message for invalid gamertag
          eventVariables.channel.send(util.format("<@!%s>, that gamertag is too long.", eventVariables.userID));
          return(1);
        }

        //format gamertags with spaces
        let gamertagRankedFormatted = gamertagRanked.replace(/ /g, "%20");

        //call ranked function
        if(playlistRanked.toUpperCase() == "1X") {
          //information to connect to haloapi
          const options1X = {
            hostname: "www.haloapi.com",
            path: util.format("/stats/hw2/players/%s/stats/seasons/current", gamertagRankedFormatted),
            headers: {
              "Ocp-Apim-Subscription-Key": auth.key
            }
          };

          //print data from api
          rankedFunctions.get1X(options1X, eventVariables, gamertagRanked, gamertagRankedFormatted);
        } else if(playlistRanked.toUpperCase() == "3X") {
          //information to connect to haloapi
          const options3X = {
            hostname: "www.haloapi.com",
            path: util.format("/stats/hw2/players/%s/stats/seasons/current", gamertagRankedFormatted),
            headers: {
              "Ocp-Apim-Subscription-Key": auth.key
            }
          };

          //print data from api
          rankedFunctions.get3X(options3X, eventVariables, gamertagRanked, gamertagRankedFormatted);
        } else if(playlistRanked == "2") {
          //information to connect to haloapi
          const options2 = {
            hostname: "www.haloapi.com",
            path: util.format("/stats/hw2/players/%s/stats/seasons/current", gamertagRankedFormatted),
            headers: {
              "Ocp-Apim-Subscription-Key": auth.key
            }
          };

          //print data from api
          rankedFunctions.get2(options2, eventVariables, gamertagRanked, gamertagRankedFormatted);
        } else if(playlistRanked == "3") {
          //information to connect to haloapi
          const options3 = {
            hostname: "www.haloapi.com",
            path: util.format("/stats/hw2/players/%s/stats/seasons/current", gamertagRankedFormatted),
            headers: {
              "Ocp-Apim-Subscription-Key": auth.key
            }
          };

          //print data from api
          rankedFunctions.get3(options3, eventVariables, gamertagRanked, gamertagRankedFormatted);
        }
      break;

      //command: leaders
      case "leaders":
        //check for correct arguments
        if(args[0] == null && usersettings.gamertag == null) {
          //send error message for no arguments
          eventVariables.channel.send(util.format("<@!%s>, use ~link <gamertag> to link your gamertag to your discord.", eventVariables.userID));
          return(1);
        }

        //get gamertag
        let leadersGamertag;
        if(args[0] == null) {
          leadersGamertag = usersettings.gamertag;
        } else if(command == "leaders") {
          leadersGamertag = message.content.substring(9);
        }

        //check for correct argument
        if(leadersGamertag.length > 15) {
          //send error message for invalid argument
          eventVariables.channel.send(util.format("<@!%s>, that gamertag is too long.", eventVariables.userID));
          return(1);
        }

        //format gamertags with spaces
        let leadersGamertagFormatted = leadersGamertag.replace(/ /g, "%20");

        //information to connect to haloapi
        const loptions = {
          hostname: "www.haloapi.com",
          path: util.format("/stats/hw2/players/%s/stats?", leadersGamertagFormatted),
          headers: {
            "Ocp-Apim-Subscription-Key": auth.key
          }
        };

        //get request
        http.get(loptions, (res) => {
          //check for valid gamertag
          if (res.statusCode == 404) {
            //send error message for invalid gamertag
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
              //send error message for invalid gamertag
              eventVariables.channel.send(util.format("<@!%s>, %s has not played any games.", eventVariables.userID, leadersGamertag));
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

            //get data for leaders
            var max = -1;
            var mid = -1;
            var min = -1;
            var maxLeader = "";
            var midLeader = "";
            var minLeader = "";
            for(var leader in parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats) {
              if(parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[leader].TotalMatchesStarted > max) {
                max = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[leader].TotalMatchesStarted;
                maxLeader = leader;
                if(maxLeader == "Lekgolo") {
                  maxLeader = "Colony"
                }
              } else if(parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[leader].TotalMatchesStarted > mid) {
                mid = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[leader].TotalMatchesStarted;
                midLeader = leader;
                if(midLeader == "Lekgolo") {
                  midLeader = "Colony"
                }
              } else if(parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[leader].TotalMatchesStarted > min) {
                min = parsedData.MatchmakingSummary.SocialPlaylistStats[index].LeaderStats[leader].TotalMatchesStarted;
                minLeader = leader;
                if(minLeader == "Lekgolo") {
                  minLeader = "Colony"
                }
              }
            }

            //check if bot has permission to embed links
            if(!eventVariables.guild.me.permissionsIn(eventVariables.channel).has("EMBED_LINKS")) {
              //send error message for no permissions
              eventVariables.channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", eventVariables.userID));
              return(1);
            }

            //send embedded message with stats
            eventVariables.channel.send({ embed: {
              author: {
                name: "Leader Stats for " + leadersGamertag
              },
              color: eventVariables.embedcolor,
              thumbnail: {
                url: "attachment://leader.png",
                height: 1920 * .01,
                width: 1452 * .01
              },
              fields: [
                {
                  name: maxLeader,
                  value: "Games played: " + max,
                  inline: false
                },
                {
                  name: midLeader,
                  value: "Games played: " + mid,
                  inline: false
                },
                {
                  name: minLeader,
                  value: "Games played: " + min,
                  inline: false
                }
              ]
            }, files: [
              {
                attachment: util.format("./assets/leaderpictures/%s.png", maxLeader),
                name: "leader.png"
              }
            ]});
          });
        });
      break;

      //no command
      default:
        //send error message for invalid command
        eventVariables.channel.send(util.format("<@!%s>, that is not a valid command.", eventVariables.userID));
        return(1);
      break;

    }

  }

});
