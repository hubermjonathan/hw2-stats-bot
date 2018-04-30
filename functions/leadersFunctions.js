//setup variables
const auth = require("../auth.json"); //auth token and api key
const util = require("util"); //string formatting
const http = require("https"); //api access

var getTop3 = function(options, eventVariables, gamertag, gamertagFormatted) {
  var leaderCounts = [
    {name: "Cutter", count: 0},
    {name: "Isabel", count: 0},
    {name: "Anders", count: 0},
    {name: "Forge", count: 0},
    {name: "Kinsano", count: 0},
    {name: "Johnson", count: 0},
    {name: "Jerome", count: 0},
    {name: "Serina", count: 0},
    {name: "Decimus", count: 0},
    {name: "Atriox", count: 0},
    {name: "Shipmaster", count: 0},
    {name: "Lekgolo", count: 0},
    {name: "Arbiter", count: 0},
    {name: "YapYap", count: 0},
    {name: "Voridus", count: 0},
    {name: "Pavium", count: 0}
  ];

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
      const parsedDataUnranked = JSON.parse(rawData);

      //check if user has not played games
      if(parsedDataUnranked.MatchmakingSummary.SocialPlaylistStats.length != 0) {
        //count unranked games
        //find correct playlist index
        var playlistIndex = -1;
        for(var i = 0; i < parsedDataUnranked.MatchmakingSummary.SocialPlaylistStats.length; i++) {
          //find team war id
          if(parsedDataUnranked.MatchmakingSummary.SocialPlaylistStats[i].PlaylistId == "282fc197-7bf1-4865-81ec-a312d07567b6") {
            playlistIndex = i;
            break;
          }
        }

        //count leaders
        for(var leader in parsedDataUnranked.MatchmakingSummary.SocialPlaylistStats[playlistIndex].LeaderStats) {
          //find correct leader index
          var leaderIndex = -1;
          for(var i = 0; i < leaderCounts.length; i++) {
            if(leaderCounts[i].name == leader) {
              leaderIndex = i;
              break;
            }
          }

          //add games started to leader
          leaderCounts[leaderIndex].count = leaderCounts[leaderIndex].count + parsedDataUnranked.MatchmakingSummary.SocialPlaylistStats[playlistIndex].LeaderStats[leader].TotalMatchesStarted;
        }
      }

      //count ranked games
      //information to connect to haloapi
      const options = {
        hostname: "www.haloapi.com",
        path: util.format("/stats/hw2/players/%s/stats/seasons/current", gamertagFormatted),
        headers: {
          "Ocp-Apim-Subscription-Key": auth.key
        }
      };

      http.get(options, (res) => {
        //get user stats
        var rawData = "";
        res.on("data", (chunk) => { rawData += chunk; });

        res.on("end", () => {
          //parse data
          const parsedDataRanked = JSON.parse(rawData);

          //check if user has not played any games
          if(parsedDataUnranked.MatchmakingSummary.SocialPlaylistStats.length == 0 && parsedDataRanked.RankedPlaylistStats.length == 0) {
            eventVariables.channel.send(util.format("<@!%s>, %s has not played any games.", eventVariables.userID, gamertag));
            return(1);
          }

          if(parsedDataRanked.RankedPlaylistStats.length != 0) {
            //loop through all ranked playlists
            for(var i = 0; i < parsedDataRanked.RankedPlaylistStats.length; i++) {
              //count leaders
              for(var leader in parsedDataRanked.RankedPlaylistStats[i].LeaderStats) {
                //find correct leader index
                var leaderIndex = -1;
                for(var j = 0; j < leaderCounts.length; j++) {
                  if(leaderCounts[j].name == leader) {
                    leaderIndex = j;
                    break;
                  }
                }

                //add games started to leader
                leaderCounts[leaderIndex].count = leaderCounts[leaderIndex].count + parsedDataRanked.RankedPlaylistStats[i].LeaderStats[leader].TotalMatchesStarted;
              }
            }
          }

          //find max, mid, and min
          var max = -1;
          var mid = -1;
          var min = -1;
          var maxLeader = "";
          var midLeader = "";
          var minLeader = "";
          for(var i = 0; i < leaderCounts.length; i++) {
            if(leaderCounts[i].count > max) {
              min = mid;
              minLeader = midLeader;

              mid = max;
              midLeader = maxLeader;

              max = leaderCounts[i].count;
              maxLeader = leaderCounts[i].name;
              if(maxLeader == "Lekgolo") {
                maxLeader = "Colony"
              }
            } else if(leaderCounts[i].count > mid) {
              min = mid;
              minLeader = midLeader;

              mid = leaderCounts[i].count;
              midLeader = leaderCounts[i].name;
              if(midLeader == "Lekgolo") {
                midLeader = "Colony"
              }
            } else if(leaderCounts[i].count > min) {
              min = leaderCounts[i].count;
              minLeader = leaderCounts[i].name;
              if(minLeader == "Lekgolo") {
                minLeader = "Colony"
              }
            }
          }

          //check if bot has permission to embed links
          if(!eventVariables.guild.me.permissionsIn(eventVariables.channel).has("EMBED_LINKS")) {
            eventVariables.channel.send(util.format("<@!%s>, make sure that I have the permissions to embed links.", eventVariables.userID));
            return(1);
          }

          //send embedded message with stats
          eventVariables.channel.send({ embed: {
            author: {
              name: "Top 3 Leaders for " + gamertag
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
    });
  });
}

module.exports.getTop3 = getTop3;
