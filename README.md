# hw2statsbot
**v1.2.2** <img src="assets/logo.png" align="right" alt="logo" width="200px" height="200px"></br>
hw2statsbot is a discord bot that provides statistics for the game halo wars 2</br>
[main code](stats.js) | [author](#author)

### invite the bot to your server!
[click here](https://discordapp.com/oauth2/authorize?client_id=431499279782117386&scope=bot)
### current features
**gamertag linking** - link your gamertag to your discord account so you don't have to type it everytime you want your stats</br>
**unranked stats** - get stats for unranked playlists like total games, win percentage, and favorite leader</br>
**ranked stats** - get stats for ranked playlists like rank, csr, mmr, and win percentage</br>
**leader stats** - get most played leaders</br>
**build order** - view build order for most recent game of a player
### upcoming features
add last build order command
### version history
**1.2.2** - user friendly changes, bug fixes</br>
**1.2.1** - split overall ranked to season high and all time high, bug fixes</br>
**1.2.0** - added command to get build order of last game, bug fixes</br>
**1.1.2** - changed leaders command to combine data from ranked and unranked playlists, bug fixes</br>
**1.1.1** - added argument to get season high stats for ranked, bug fixes</br>
**1.1.0** - major refactor, added argument to get desired playlist stats (1x/3x/2/3/teamwar/etc), added mmr and current rank (rather than highest rank) to ranked command, bug fixes</br>
**1.0.3** - added command to get most played leaders in team war, bug fixes</br>
**1.0.2** - added tier (plat 2, gold 3, etc.) to ranked stats</br>
**1.0.1** - changed embed message color</br>
**1.0.0** - added gamertag linking, added team war stats, added ranked stats
### creating your own version
1. click fork in the upper right hand corner to create a copy of this repo to edit on your own
2. clone your repo
3. create a json file called auth.json containing your discord bot token and your halo api key like this:
```
{
  "token": "YOUR-DISCORD-TOKEN",
  "key": "YOUR-HALO-API-KEY"
}
```
4. run npm install and then npm install discord.js in your repo folder
5. start creating!
#### author
Jon Huber</br>
Purdue Computer Science 2021</br>
[hubermjonathan@gmail.com](mailto:hubermjonathan@gmail.com)
