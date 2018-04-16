# hw2statsbot
hw2statsbot is a discord bot that provides statistics for the game halo wars 2
[main code](stats.js)

### invite the bot to your server!
[click here](https://discordapp.com/oauth2/authorize?client_id=431499279782117386&scope=bot)
### current features
**gamertag linking** - link your gamertag to your discord account so you don't have to type it everytime you want your stats
**team war stats** - get stats for team war like total games, win percentage, and favorite leader
**ranked stats** - get stats for 1v1 ranked and 3v3 ranked like rank, csr, and win percentage
### upcoming features
none so far, create a request for one if you have an idea
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
Jon Huber
Purdue Computer Science 2021
hubermjonathan@gmail.com
