/*
  Discord Plays Minesweeper Bot
*/
const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
const boardhandler = require("./MinesweeperBoardRenderer.js");
var jsonfile = require("./configs.json");
var boardArray = []; // Guild Id, Channel Id, X, (255 is board params [xSize, ySize, sMines, dMines, tMines, aMines]) Y, [Uncovered, Flag type, Mine type, totol of surrounding mines]

var maxBoardX = 50;
var maxBoardY = 50;

client.on("ready", () => {
  console.log("DPMS Bot v1.0");
  console.log("Initializing...");
  // init code here
  console.log("done");
  console.log("Thanks to MrMelon54 and Blananas2");
});
client.on("message", message => {
  if (message.content.startsWith(">") && !message.content.startsWith("> ")) {
    processCommand(message);
  }
});

function updateStatus() {
  client.user.setStatus("online");
  client.user.setActivity(jsonfile.status.activity, {
    type: jsonfile.status.presence.toUpperCase()
  });
}

function processCommand(receivedMessage) {
  // wheeeeee copying code

  let fullCommand = receivedMessage.content.substr(1); // Remove the leading exclamation mark
  let splitCommand = fullCommand.split(" "); // Split the message up in to pieces for each space
  let primaryCommand = splitCommand[0].toLowerCase(); // The first word directly after the exclamation is the command
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
    } else if (primaryCommand == "board") {
      boardCommand(receivedMessage, arguments);
    } else {
      receivedMessage.channel.send("Unknown command. Use >help for help.");
    }
  } catch (err) {
    if (err.message !== "Failed: bomb exploded") {
      if (err.message.indexOf("Error: ") == 0) {
        receivedMessage.channel.send(
          new Discord.RichEmbed()
            .setColor("#ff0000")
            .setAuthor("Uh Oh...")
            .setTitle(err.message.slice(7, err.message.length))
        );
      } else {
        receivedMessage.channel.send("A fault occured :sob: Please inform my developer");
        console.error(err);
      }
    }
  }
}
function helpCommand(msg, args) {
  var o = [
    "Github:\n",
    "https://github.com/MrMelon54/discordbot-plays-minesweeper\n",
    "`>help` - Shows this\n",
    "`>start [width] [height] [single mines] {double mines} {triple mines} {anti-mines}` - Starts a game with those parameters\n",
    "`>dig [A1] {B2} {AA5}...` - Dig those positions in an ongoing game\n",
    "`>flag [A1] {B2} {type} {C3} {D4} {type} {E5}` - Flags multiple positions with different flag types (last ones will default to single)\n",
    "`>board` - Displays the current state of the game\n"
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
    if (Object.keys(boardArray[guildId]).includes(channelId)) {
      return msg.channel.send("There is already a game running here. Try in another channel.");
    }
  }
  if (!Object.keys(boardArray).includes(guildId)) {
    boardArray[guildId] = {};
  }
  if (!Object.keys(boardArray[guildId]).includes(channelId)) {
    boardArray[guildId][channelId] = {};
  }

  if (xSize <= 0 || ySize <= 0) {
    delete boardArray[guildId][channelId];
    throw new Error("Error: Board too small!");
  }
  if (xSize > maxBoardX || ySize > maxBoardY) {
    delete boardArray[guildId][channelId];
    throw new Error("Error: Board too big!");
  }

  var sCount = 0,
    dCount = 0,
    tCount = 0,
    aCount = 0,
    randMine = 0;
  var totalMines = sMines + dMines + tMines + aMines;

  if (xSize * ySize < totalMines) {
    throw new Error("Error: Too many mines for the board!");
  }

  if (totalMines < 1) {
    throw new Error("Error: Not enough mines on the board!");
  }

  boardArray[guildId][channelId][255] = [xSize, ySize, sMines, dMines, tMines, aMines];
  var xRand = 0,
    yRand = 0;
  var regenMine = true;

  for (i = 0; i < xSize; i++) {
    boardArray[guildId][channelId][i] = [];
    for (j = 0; j < ySize; j++) {
      boardArray[guildId][channelId][i][j] = [0, 0, 0, 255];
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

  displayBoard(guildId, channelId, (exploded = false), (won = false));
}
function boardCommand(msg, args) {
  if (args.length > 0) {
    return msg.channel.send("Invalid options. Use >help for help.");
  }
  [guildId, channelId] = [msg.guild.id, msg.channel.id];
  if (!Object.keys(boardArray).includes(guildId)) {
    return msg.channel.send("No game running here. Learn how to start one in >help");
  }
  if (!Object.keys(boardArray[guildId]).includes(channelId)) {
    return msg.channel.send("No game running here. Learn how to start one in >help");
  }

  displayBoard(guildId, channelId);
}
function flagCommand(msg, args) {
  // coord is type string, such as 'A1' or 'G6' | flagType is type string, only 'S', 'D', 'T' or 'A' (case-insensitive)
  if (args.length < 1) {
    return msg.channel.send("Invalid options. Use >help for help.");
  }
  [guildId, channelId] = [msg.guild.id, msg.channel.id];
  if (!Object.keys(boardArray).includes(guildId)) {
    return msg.channel.send("No game running here. Learn how to start one in >help");
  }
  if (!Object.keys(boardArray[guildId]).includes(channelId)) {
    return msg.channel.send("No game running here. Learn how to start one in >help");
  }
  var xMax = boardArray[guildId][channelId][255][0];
  var yMax = boardArray[guildId][channelId][255][1];

  ap = parseFlagCommandArgs(args);
  for (var j = 0; j < ap.length; j++) {
    args = ap[j];
    flagType = args.pop();
    coords = args;

    for (var i = 0; i < coords.length; i++) {
      var coord = coords[i];
      var newCoord;
      var flagInt;
      try {
        newCoord = cellA1ToIndex(coord);
        flagInt = flagToInt(flagType);
      } catch (err) {
        throw err;
      }

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
    }
  }
  displayBoard(guildId, channelId, (exploded = false), (won = false));
}

function parseFlagCommandArgs(args) {
  var o = [];
  var section = [];
  var error = false;
  for (var i = 0; i < args.length; i++) {
    try {
      cellA1ToIndex(args[i]);
      section.push(args[i]);
      continue;
    } catch (err) {
      if (section.length == 0) {
        error = true;
        break;
      }
    }
    try {
      flagToInt(args[i]);
      section.push(args[i]);
      o.push([...section]);
      section = [];
      continue;
    } catch (err) {
      error = true;
      break;
    }
  }
  if (error) throw new Error("Error: Arguments invalid for flag command");
  if (section.length > 0) {
    section.push("s");
    o.push(section);
  }
  return o;
}

function digCommand(msg, args, _a = true) {
  if (args.length < 1) {
    return msg.channel.send("Invalid options. Use >help for help.");
  }
  if (args.length > 1) {
    for (var i = 0; i < args.length; i++) {
      if (args[i] === null) continue;
      var o = digCommand(msg, [args[i]], i == args.length - 1);
      for (var j = [...[i]][0]; j < args.length; j++) {
        var cell = cellA1ToIndex(args[j]);
        if (o.filter(x => cell.col == o[0] && cell.row == o[1]).length >= 1) args[j] = null;
      }
    }
    return;
  }
  [coord] = args;
  [guildId, channelId] = [msg.guild.id, msg.channel.id];
  if (!Object.keys(boardArray).includes(guildId)) {
    return msg.channel.send("No game running here. Learn how to start one in >help");
  }
  if (!Object.keys(boardArray[guildId]).includes(channelId)) {
    return msg.channel.send("No game running here. Learn how to start one in >help");
  }

  var xMax = boardArray[guildId][channelId][255][0];
  var yMax = boardArray[guildId][channelId][255][1];

  if (coord == "remaining" || coord == "rest") {
    for (var i = 0; i < xMax; i++) {
      for (var j = 0; j < yMax; j++) {
        var cell = boardArray[guildId][channelId][i][j];
        if (cell[0] == 0 && cell[1] == 0) {
          boardArray[guildId][channelId][i][j][0] = 1;
          if (cell[2] != 0) {
            return bombExplode(guildId, channelId);
          }
        }
      }
    }
    detectWin(guildId, channelId);
    displayBoard(guildId, channelId);
    return;
  }

  var newCoord;
  try {
    newCoord = cellA1ToIndex(coord);
  } catch (err) {
    throw err;
  }

  var filledCells = [];
  if (newCoord.row > xMax || newCoord.col > yMax) {
    throw new Error("Error: Outside board range");
  } else if (boardArray[guildId][channelId][newCoord.row][newCoord.col][1] != 0) {
    throw new Error("Error: Attempted to dig flagged square");
  } else if (boardArray[guildId][channelId][newCoord.row][newCoord.col][0] == 1) {
    //throw new Error("Error: Square already uncovered");
    //Just skip this error for now it annoys everyone
  } else {
    filledCells = floodFill(guildId, channelId, newCoord.row, newCoord.col);
  }

  detectWin(guildId, channelId);

  if (_a) displayBoard(guildId, channelId);

  return filledCells;
}

function detectWin(guildId, channelId) {
  var xMax = boardArray[guildId][channelId][255][0];
  var yMax = boardArray[guildId][channelId][255][1];
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
}

function bombExplode(guildId, channelId) {
  displayBoard(guildId, channelId, (exploded = true));
  delete boardArray[guildId][channelId];
  throw new Error("Failed: bomb exploded");
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
  var c = 255;
  for (var i = 0; i < toCheck.length; i++) {
    if (toCheck[i][0] < 0 || toCheck[i][1] < 0 || toCheck[i][0] >= boardArray[guildId][channelId][255][0] || toCheck[i][1] >= boardArray[guildId][channelId][255][1]) continue;
    switch (boardArray[guildId][channelId][toCheck[i][0]][toCheck[i][1]][2]) {
      case -1:
        if (c == 255) c = 0;
        c--;
        break;
      case 1:
        if (c == 255) c = 0;
        c++;
        break;
      case 2:
        if (c == 255) c = 0;
        c += 2;
        break;
      case 3:
        if (c == 255) c = 0;
        c += 3;
        break;
    }
  }
  return c;
}

function floodFill(guildId, channelId, posX, posY, cells = []) {
  var toCheck = [[posX, posY]];
  var i = -1;
  while (i < toCheck.length - 1) {
    i++;
    if (toCheck[i][0] < 0 || toCheck[i][0] >= boardArray[guildId][channelId][255][0]) continue;
    if (toCheck[i][1] < 0 || toCheck[i][1] >= boardArray[guildId][channelId][255][1]) continue;
    var cell = boardArray[guildId][channelId][toCheck[i][0]][toCheck[i][1]];
    if (cell[1] == 0) {
      cells.push(toCheck[i]);
      boardArray[guildId][channelId][toCheck[i][0]][toCheck[i][1]][0] = 1;
    }
    if (cell[2] != 0) {
      return bombExplode(guildId, channelId);
    }
    if (cell[1] == 0 && cell[2] == 0 && cell[3] == 255) {
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
  return cells;
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
  if (typeof colA1 !== "string" || colA1.length > 2) throw new Error("Error: Expected column label.");

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
// no problemo bro xD
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

  if (boardArray[guildId][channelId] === undefined) return;
  var g = [];
  for (var i = 0; i < boardArray[guildId][channelId][255][0]; i++) {
    g.push([]);
    for (var j = 0; j < boardArray[guildId][channelId][255][1]; j++) {
      g[i].push(calculateCurrentCellView(boardArray[guildId][channelId][i][j]));
    }
  }
  var b = new boardhandler.MinesweeperBoard(g, boardArray[guildId][channelId][255][1], boardArray[guildId][channelId][255][0]);
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
  } else if (exploded == true) {
    client.guilds
      .get(guildId)
      .channels.get(channelId)
      .send(generateBoardEmbed(boardArray, guildId, channelId))
      .then(m => {
        b.render(img => {
          m.delete();
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
      });
  } else {
    client.guilds
      .get(guildId)
      .channels.get(channelId)
      .send(generateBoardEmbed(boardArray, guildId, channelId).addField("Loading...", "(eta 3 years)"))
      .then(m => {
        b.render(img => {
          m.delete();
          client.guilds
            .get(guildId)
            .channels.get(channelId)
            .send(
              generateBoardEmbed(boardArray, guildId, channelId)
                .attachFile(new Discord.Attachment(img, "minesweeperboard.png"))
                .setImage("attachment://minesweeperboard.png")
            );
        });
      });
  }
  // add code to make message here pls
}

function generateBoardEmbed(boardArray, guildId, channelId) {
  return new Discord.RichEmbed()
    .setAuthor("Minesweeper!", jsonfile.logoGame)
    .setTitle("Standard (" + boardArray[guildId][channelId][255][0] + "x" + boardArray[guildId][channelId][255][1] + ")")
    .setDescription(">dig [A1] to dig | >flag [A1] (S,D,T,A) to flag")
    .addField(
      "Mines:",
      "Single: " +
        flaggedMines(guildId, channelId, 1) +
        "/" +
        boardArray[guildId][channelId][255][2] +
        " | Double: " +
        flaggedMines(guildId, channelId, 2) +
        "/" +
        boardArray[guildId][channelId][255][3] +
        " | Triple: " +
        flaggedMines(guildId, channelId, 3) +
        "/" +
        boardArray[guildId][channelId][255][4] +
        " | Anti: " +
        flaggedMines(guildId, channelId, 4) +
        "/" +
        boardArray[guildId][channelId][255][5]
    )
}

function flaggedMines(guildId, channelId, mineType) {
  var c = 0;
  var b = boardArray[guildId][channelId];
  for (var x = 0; x < b[255][0]; x++) {
    for (var y = 0; y < b[255][1]; y++) {
      if (b[x][y][1] == mineType) c++;
    }
  }
  return c;
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
        if (cell[3] == 255) return "blank";
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
client.login(process.env.TOKEN);
