/*
  Discord Plays Minesweeper Bot
*/
const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
const boardhandler = require("./MinesweeperBoardRenderer.js");
var jsonfile = require("./configs.json");
var tokenfile = require("./token.json");
var boardArray = []; // Guild Id, Channel Id, X, (255 is board params [xSize, ySize, sMines, dMines, tMines, aMines]) Y, [Uncovered, Flag type, Mine type, totol of surrounding mines]

client.on("ready", () => {
  console.log("DPMS Bot Beta v0.1");
  console.log("Initializing...");
  // init code here
  console.log("done");
});
client.on("message", message => {
  if (message.content.startsWith(">")) {
    processCommand(message);
  }
});

function processCommand(receivedMessage) {
  // wheeeeee copying code

  let fullCommand = receivedMessage.content.substr(1); // Remove the leading exclamation mark
  let splitCommand = fullCommand.split(" "); // Split the message up in to pieces for each space
  let primaryCommand = splitCommand[0]; // The first word directly after the exclamation is the command
  let arguments = splitCommand.slice(1); // All other words are arguments/parameters/options for the command
  try {
    if (primaryCommand == "help") {
      helpCommand(receivedMessage, arguments);
    } else if (primaryCommand == "start") {
      startCommand(receivedMessage, arguments);
    } else if (primaryCommand == "flag") {
      flagCommand(receivedMessage, arguments);
    } else if (primaryCommand == "dig") {
      digCommand(receivedMessage, arguments);
    } else {
      receivedMessage.channel.send("Unknown command. Use >help for help.");
    }
  } catch (err) {
    /*
    if(err.message!=="Failed: bomb exploded") {
      if(err.message.indexOf("Error: ")==0) {
        receivedMessage.channel.send(err.message);
      } else {
        receivedMessage.channel.send("I found an error :sob: ");
        console.error(err);
      }
    }
    */

    receivedMessage.channel.send(
      new Discord.RichEmbed()
        .setColor("#ff0000")
        .setAuthor("Uh Oh...")
        .setTitle(err)
    );
  }
}
function helpCommand(msg, args) {
  var o = [
    "This is some unhelpful text :rofl: \n",
    "`>start <width> <height> <mines> [double mines] [triple mines] [anti mines]` = start a game",
    "`>flag <coords> <flag type>` = place a flag (flag type defaults to single if not specified)",
    "`>dig <coords>` = dig"
  ];
  msg.channel.send(o.join("\n"));
  return;
}

function startCommand(msg, args) {
  if (args.length < 3 || args.length > 6) {
    return msg.channel.send("Invalid options. Use >help for help.");
  }
  var o = args.map(x => parseInt(x.trim()));
  while (o.length < 6) o.push(0);
  [xSize, ySize, sMines, dMines, tMines, aMines] = o;
  [guildId, channelId] = [msg.guild.id, msg.channel.id];
  if (Object.keys(boardArray).includes(guildId)) {
    if (Object.keys(boardArray[guildId]).includes(channelId)) return msg.channel.send("No game running here. Learn how to start one in >help");
  }
  if (!Object.keys(boardArray).includes(guildId)) {
    boardArray[guildId] = {};
  }
  if (!Object.keys(boardArray[guildId]).includes(channelId)) {
    boardArray[guildId][channelId] = {};
  }

  if (xSize > 50 || ySize > 50) {
    throw new Error("Error: Board too big!");
  }

  var sCount = 0,
    dCount = 0,
    tCount = 0,
    aCount = 0,
    randMine = 0;
  var totalMines = sMines + dMines + tMines + aMines;

  boardArray[guildId][channelId][255] = [xSize, ySize, sMines, dMines, tMines, aMines];
  var xRand = 0,
    yRand = 0;
  var regenMine = true;

  for (i = 0; i < xSize; i++) {
    boardArray[guildId][channelId][i] = [];
    for (j = 0; j < ySize; j++) {
      boardArray[guildId][channelId][i][j] = [0, 0, 0, 0];
    }
  }

  var previousMineCoords = [];
  for (var i = 0; i < totalMines; i++) {
    xRand = Math.floor(Math.random() * xSize);
    yRand = Math.floor(Math.random() * ySize);
    while (previousMineCoords.filter(x => x[0] == xRand && x[1] == yRand).length >= 1) {
      xRand = Math.floor(Math.random() * xSize);
      yRand = Math.floor(Math.random() * ySize);
    }
    regenMine = true;
    while (regenMine == true) {
      randMine = randomMine();
      if (randMine == 1) {
        if (sCount == sMines) {
          regenMine = true;
        } else {
          sCount++;
          regenMine = false;
        }
      } else if (randMine == 2) {
        if (dCount == dMines) {
          regenMine = true;
        } else {
          dCount++;
          regenMine = false;
        }
      } else if (randMine == 3) {
        if (tCount == tMines) {
          regenMine = true;
        } else {
          tCount++;
          regenMine = false;
        }
      } else if (randMine == 4) {
        if (aCount == aMines) {
          regenMine = true;
        } else {
          aCount++;
          regenMine = false;
          randMine = -1;
        }
      } else {
        throw new Error("Error: Invalid Value for randMine");
      }
    }
    boardArray[guildId][channelId][xRand][yRand][2] = randMine;
    previousMineCoords.push([xRand, yRand]);
  }

  fillNumbers(guildId, channelId);

  displayBoard(guildId, channelId, (exploded = false), (won = true));
}
function flagCommand(msg, args) {
  // coord is type string, such as 'A1' or 'G6' | flagType is type string, only 'S', 'D', 'T' or 'A' (case-insensitive)
  if (args.length < 1 || args.length > 2) {
    return msg.channel.send("Invalid options. Use >help for help.");
  }
  if (args.length == 1) args[1] = "s";
  [coord, flagType] = args;
  [guildId, channelId] = [msg.guild.id, msg.channel.id];
  if (!Object.keys(boardArray).includes(guildId)) {
    return msg.channel.send("No game running here. Learn how to start one in >help");
  }
  if (!Object.keys(boardArray[guildId]).includes(channelId)) {
    return msg.channel.send("No game running here. Learn how to start one in >help");
  }

  var newCoord;
  var flagInt;
  try {
    newCoord = cellA1ToIndex(coord);
    flagInt = flagToInt(flagType);
  } catch (err) {
    throw err;
  }

  var xMax = boardArray[guildId][channelId][255][0];
  var yMax = boardArray[guildId][channelId][255][1];

  if (boardArray[guildId][channelId][255] == undefined) {
    throw new Error("Error: No board");
  } else if (newCoord.row > xMax || newCoord.col > yMax) {
    throw new Error("Error: Outside board range");
  } else if (boardArray[guildId][channelId][newCoord.row][newCoord.col][0] == 1) {
    throw new Error("Error: Attempted to flag uncovered square");
  } else {
    if (boardArray[guildId][channelId][newCoord.row][newCoord.col][1] == 0) {
      boardArray[guildId][channelId][newCoord.row][newCoord.col][1] = flagInt;
    } else {
      boardArray[guildId][channelId][newCoord.row][newCoord.col][1] = 0;
    }
  }

  displayBoard(guildId, channelId, (exploded = false), (won = true));
}

function digCommand(msg, args) {
  if (args.length != 1) {
    return msg.channel.send("Invalid options. Use >help for help.");
  }
  [coord] = args;
  [guildId, channelId] = [msg.guild.id, msg.channel.id];
  if (!Object.keys(boardArray).includes(guildId)) {
    return msg.channel.send("No game running here. Learn how to start one in >help");
  }
  if (!Object.keys(boardArray[guildId]).includes(channelId)) {
    return msg.channel.send("No game running here. Learn how to start one in >help");
  }

  var newCoord;
  try {
    newCoord = cellA1ToIndex(coord);
  } catch (err) {
    throw err;
  }
  var xMax = boardArray[guildId][channelId][255][0];
  var yMax = boardArray[guildId][channelId][255][1];

  if (newCoord.row > xMax || newCoord.col > yMax) {
    throw new Error("Error: Outside board range");
  } else if (boardArray[guildId][channelId][newCoord.row][newCoord.col][1] != 0) {
    throw new Error("Error: Attempted to dig flagged square");
  } else if (boardArray[guildId][channelId][newCoord.row][newCoord.col][0] == 1) {
    throw new Error("Error: Square already uncovered");
  } else {
    floodFill(guildId, channelId, newCoord.row, newCoord.col);
  }
  // detecting if you won code
  var totalSquares = (xMax - 1) * (yMax - 1);
  var totalNonMines = 0;
  var totalUncovered = 0;
  for (var i = 0; i < xMax; i++) {
    for (var j = 0; j < yMax; j++) {
      if (boardArray[guildId][channelId][i][j][2] == 0) {
        totalNonMines++;
      }
      if (boardArray[guildId][channelId][i][j][0] == 1) {
        totalUncovered++;
      }
    }
  }
  if (totalNonMines == totalUncovered) {
    return gameWin(guildId, channelId);
  }

  displayBoard(guildId, channelId);
}

function bombExplode(guildId, channelId) {
  displayBoard(guildId, channelId, (exploded = true));
  delete boardArray[guildId][channelId];
  // throw new Error("Failed: bomb exploded");
}

function gameWin(guildId, channelId) {
  displayBoard(guildId, channelId, (won = true));
  delete boardArray[guildId][channelId];
}

function fillNumbers(guildId, channelId) {
  var b = boardArray[guildId][channelId];
  for (var i = 0; i < b[255][0]; i++) {
    for (var j = 0; j < b[255][1]; j++) {
      boardArray[guildId][channelId][i][j][3] = findMines(guildId, channelId, i, j);
    }
  }
}

function findMines(guildId, channelId, x, y) {
  var toCheck = [
    [x - 1, y - 1],
    [x - 1, y],
    [x - 1, y + 1],
    [x, y - 1],
    [x, y + 1],
    [x + 1, y - 1],
    [x + 1, y],
    [x + 1, y + 1]
  ];
  var c = 0;
  for (var i = 0; i < toCheck.length; i++) {
    if (toCheck[i][0] < 0 || toCheck[i][1] < 0 || toCheck[i][0] >= boardArray[guildId][channelId][255][0] || toCheck[i][1] >= boardArray[guildId][channelId][255][1]) continue;
    switch (boardArray[guildId][channelId][toCheck[i][0]][toCheck[i][1]][2]) {
      case -1:
        c--;
        break;
      case 1:
        c++;
        break;
      case 2:
        c += 2;
        break;
      case 3:
        c += 3;
        break;
    }
  }
  return c;
}

function floodFill(guildId, channelId, posX, posY) {
  var toCheck = [[posX, posY]];
  var i = -1;
  while (i < toCheck.length - 1) {
    i++;
    if (toCheck[i][0] < 0 || toCheck[i][0] >= boardArray[guildId][channelId][255][0]) continue;
    if (toCheck[i][1] < 0 || toCheck[i][1] >= boardArray[guildId][channelId][255][1]) continue;
    boardArray[guildId][channelId][toCheck[i][0]][toCheck[i][1]][0] = 1;
    if (boardArray[guildId][channelId][toCheck[i][0]][toCheck[i][1]][2] != 0) {
      bombExplode(guildId, channelId);
    }
    var cell = boardArray[guildId][channelId][toCheck[i][0]][toCheck[i][1]];
    if (cell[1] == 0 && cell[2] == 0 && cell[3] == 0) {
      // check if cell is blank
      var x = toCheck[i][0];
      var y = toCheck[i][1];
      if (!floodFillChecker(toCheck, [x - 1, y - 1])) toCheck.push([x - 1, y - 1]);
      if (!floodFillChecker(toCheck, [x - 1, y])) toCheck.push([x - 1, y]);
      if (!floodFillChecker(toCheck, [x - 1, y + 1])) toCheck.push([x - 1, y + 1]);
      if (!floodFillChecker(toCheck, [x, y - 1])) toCheck.push([x, y - 1]);
      if (!floodFillChecker(toCheck, [x, y + 1])) toCheck.push([x, y + 1]);
      if (!floodFillChecker(toCheck, [x + 1, y - 1])) toCheck.push([x + 1, y - 1]);
      if (!floodFillChecker(toCheck, [x + 1, y])) toCheck.push([x + 1, y]);
      if (!floodFillChecker(toCheck, [x + 1, y + 1])) toCheck.push([x + 1, y + 1]);
    }
  }
}

function floodFillChecker(arr, pos) {
  return arr.some(d => JSON.stringify(d) === JSON.stringify(pos));
}

function randomMine() {
  return Math.floor(Math.random() * 4 + 1);
}
function flagToInt(flagType) {
  switch (flagType.toLowerCase()) {
    case "s":
      return 1;
    case "d":
      return 2;
    case "t":
      return 3;
    case "a":
      return 4;
    default:
      throw new Error("Error: Invalid flag type");
  }
}

// past here is copied code
function cellA1ToIndex(cellA1) {
  // Use regex match to find column & row references.
  // Must start with letters, end with numbers.
  cellA1 = cellA1.toUpperCase();
  var match = /^([A-Z]+)([0-9]+)$/gm.exec(cellA1);

  if (match == null) throw new Error("Error: Invalid cell reference");

  var colA1 = match[1];
  var rowA1 = match[2];

  return { row: rowA1ToIndex(rowA1), col: colA1ToIndex(colA1) };
}

function colA1ToIndex(colA1) {
  if (typeof colA1 !== "string" || colA1.length > 2) throw new Error("Expected column label.");

  var A = "A".charCodeAt(0);
  var number = colA1.charCodeAt(colA1.length - 1) - A;
  if (colA1.length == 2) {
    number += 26 * (colA1.charCodeAt(0) - A + 1);
  }
  return number;
}

function rowA1ToIndex(rowA1) {
  return rowA1 - 1;
}
// thanks, melon :)
function displayBoard(guildId, channelId) {
  // temporary print script
  /*var o = [];
  var k = Object.keys(boardArray[guildId][channelId]);
  for (var l = 0; l < k.length; l++) {
    if (k[l].toString() == "255") o.push("Data: " + JSON.stringify(boardArray[guildId][channelId][k[l]]));
    else o.push(boardArray[guildId][channelId][k[l]].map(x => JSON.stringify(x)).join(" | "));
  }
  client.guilds
    .get(guildId)
    .channels.get(channelId)
    .send(o.join("\n"));*/

  var g = [];
  for (var i = 0; i < boardArray[guildId][channelId][255][0]; i++) {
    g.push([]);
    for (var j = 0; j < boardArray[guildId][channelId][255][1]; j++) {
      g[i].push(calculateCurrentCellView(boardArray[guildId][channelId][i][j]));
    }
  }
  var b = new boardhandler.MinesweeperBoard(g, boardArray[guildId][channelId][255][0], boardArray[guildId][channelId][255][1]);
  if (won == true) {
    b.render(img => {
      client.guilds
        .get(guildId)
        .channels.get(channelId)
        .send(
          new Discord.RichEmbed()
            .setColor("#00ff00")
            .setAuthor("Congratulations!", jsonfile.logoGame)
            .attachFile(new Discord.Attachment(img, "minesweeperboard.png"))
            .setImage("attachment://minesweeperboard.png")
        );
    });
  } else if (exploded == false) {
    b.render(img => {
      client.guilds
        .get(guildId)
        .channels.get(channelId)
        .send(
          new Discord.RichEmbed()
            .setColor("#ff0000")
            .setAuthor("You blew up.", jsonfile.logoGame)
            .attachFile(new Discord.Attachment(img, "minesweeperboard.png"))
            .setImage("attachment://minesweeperboard.png")
        );
    });
  } else {
    b.render(img => {
      client.guilds
        .get(guildId)
        .channels.get(channelId)
        .send(
          new Discord.RichEmbed()
            .setAuthor("Minesweeper!", jsonfile.logoGame)
            .setTitle("Standard (" + boardArray[guildId][channelId][255][0] + "x" + boardArray[guildId][channelId][255][1] + ")")
            .setDescription(">dig [A1] to dig | >flag [A1] (S,D,T,A) to flag")
            .addField(
              "Mines:",
              "Single: " +
                boardArray[guildId][channelId][255][2] +
                " | Double: " +
                boardArray[guildId][channelId][255][3] +
                " | Triple: " +
                boardArray[guildId][channelId][255][4] +
                " | Anti: " +
                boardArray[guildId][channelId][255][5]
            )
            .attachFile(new Discord.Attachment(img, "minesweeperboard.png"))
            .setImage("attachment://minesweeperboard.png")
        );
    });
  }
  // add code to make message here pls
}

function calculateCurrentCellView(cell, showExploded = true) {
  if (cell[0]) {
    switch (cell[2]) {
      case 1:
        return (showExploded ? "x" : "") + "bomb-s";
      case 2:
        return (showExploded ? "x" : "") + "bomb-d";
      case 3:
        return (showExploded ? "x" : "") + "bomb-t";
      case -1:
        return (showExploded ? "x" : "") + "bomb-a";
      default:
        if (cell[3] == 0) return "blank";
        return "cell" + cell[3];
    }
  } else {
    switch (cell[1]) {
      case 1:
        return "flag-s";
      case 2:
        return "flag-d";
      case 3:
        return "flag-t";
      case 4:
        return "flag-a";
      default:
        return "hidden";
    }
  }
}

// login stuffs
client.login(tokenfile.token);
