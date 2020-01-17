/*
  Discord Plays Minesweeper Bot
*/
const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
var jsonfile = require("./configs.json");
var tokenfile = require("./token.json");
var boardArray = []; // Guild Id, Channel Id, X, (255 is board params [xSize, ySize, sMines, dMines, tMines, aMines]) Y, [Uncovered, Flag type, Mine type, Has mines around, totol of surrounding mines]

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

  /* else if (primaryCommand == "ruleset") {
      rulesetCommand();
    } */
} // add error functionality
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
  var o=args.map(x => parseInt(x.trim()));
  while(o.length<6)o.push(0);
  [xSize, ySize, sMines, dMines, tMines, aMines] = o;
  [guildId, channelId] = [msg.guild.id, msg.channel.id];
  if (Object.keys(boardArray).includes(guildId)) {
    if (Object.keys(boardArray[guildId]).includes(channelId))
      return msg.channel.send(
        "No game running here. Learn how to start one in >help"
      );
  }
  if (!Object.keys(boardArray).includes(guildId)) {
    boardArray[guildId] = {};
  }
  if (!Object.keys(boardArray[guildId]).includes(channelId)) {
    boardArray[guildId][channelId] = {};
  }

  if (xSize > 26 || ySize > 26) {
    throw new Error("Error: Board too big!");
  }

  var sCount = 0,
    dCount = 0,
    tCount = 0,
    aCount = 0,
    randMine = 0;
  var totalMines = sMines + dMines + tMines + aMines;

  boardArray[guildId][channelId][255] = [
    xSize,
    ySize,
    sMines,
    dMines,
    tMines,
    aMines
  ];
  var xRand = 0,
    yRand = 0;
  var regenMine = true;

  for (i = 0; i < xSize; i++) {
    boardArray[guildId][channelId][i] = [];
    for (j = 0; j < ySize; j++) {
      boardArray[guildId][channelId][i][j] = [0, 0, 0, 0];
    }
  }

  var previousMineCoords=[];
  for (var i = 0; i < totalMines; i++) {
    xRand = Math.floor(Math.random() * xSize);
    yRand = Math.floor(Math.random() * ySize);
    while(previousMineCoords.filter(x=>x[0]==xRand&&x[1]==yRand).length>=1){
      xRand = Math.floor(Math.random() * xSize);
      yRand = Math.floor(Math.random() * ySize);
    }
    regenMine=true;
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
    floodFill(guildId, channelId,xRand,yRand,boardArray[guildId][channelId][255][0],boardArray[guildId][channelId][255][1]);
    previousMineCoords.push([xRand,yRand]);
  }

  var o=[];
  var k=Object.keys(boardArray[guildId][channelId]);
  for(var j=0;j<k.length;j++) {
    if(k[j].toString()=="255")o.push("Data: "+JSON.stringify(boardArray[guildId][channelId][k[i]]));
    else o.push(boardArray[guildId][channelId][k[j]].map(x=>JSON.stringify(x)).join(' | '));
  }
  msg.channel.send(o);
  // add code to make message here pls
}
function flagCommand(msg, args) {
  // coord is type string, such as 'A1' or 'G6' | flagType is type string, only 'S', 'D', 'T' or 'A' (case-insensitive)
  if (args.length < 1 || args.length > 2) {
    return msg.channel.send("Invalid options. Use >help for help.");
  }
  if (args.length == 1) args[2] = "s";
  [coord, flagType] = args;
  [guildId, channelId] = [msg.guild.id, msg.channel.id];
  if (!Object.keys(boardArray).includes(guildId)) {
    return msg.channel.send(
      "No game running here. Learn how to start one in >help"
    );
  }
  if (!Object.keys(boardArray[guildId]).includes(channelId)) {
    return msg.channel.send(
      "No game running here. Learn how to start one in >help"
    );
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
  } else if (
    boardArray[guildId][channelId][newCoord.row][newCoord.col][0] == 1
  ) {
    throw new Error("Error: Attempted to flag uncovered square");
  } else {
    if (boardArray[guildId][channelId][newCoord.row][newCoord.col][1] == 0) {
      boardArray[guildId][channelId][newCoord.row][newCoord.col][1] = flagInt;
    } else {
      boardArray[guildId][channelId][newCoord.row][newCoord.col][1] = 0;
    }
  }
}
function digCommand(msg, args) {
  if (args.length != 1) {
    return msg.channel.send("Invalid options. Use >help for help.");
  }
  [coord] = args;
  [guildId, channelId] = [msg.guild.id, msg.channel.id];
  if (!Object.keys(boardArray).includes(guildId)) {
    return msg.channel.send(
      "No game running here. Learn how to start one in >help"
    );
  }
  if (!Object.keys(boardArray[guildId]).includes(channelId)) {
    return msg.channel.send(
      "No game running here. Learn how to start one in >help"
    );
  }

  var newCoord;
  try {
    newCoord = cellA1ToIndex(coord);
  } catch (err) {
    throw err;
  }
  var xMax = boardArray[guildId][channelId][255][0];
  var yMax = boardArray[guildId][channelId][255][1];

  if (boardArray[guildId][channelId][255] == undefined) {
    throw new Error("Error: No board");
  } else if (newCoord.row > xMax || newCoord.col > yMax) {
    throw new Error("Error: Outside board range");
  } else if (
    boardArray[guildId][channelId][newCoord.row][newCoord.col][1] > 0
  ) {
    throw new Error("Error: Attempted to dig flagged square");
  } else if (
    boardArray[guildId][channelId][newCoord.row][newCoord.col][0] == 1
  ) {
    throw new Error("Error: Square already uncovered");
  } else {
    // boardArray[guildId][channelId][newCoord.row][newCoord.col][1] =
    findMines(guildId, channelId, newCoord.row, newCoord.col, xMax, yMax);
  }
}

function floodFill()

// other functions
function floodFill(guildId, channelId, posX, posY, xMax, yMax) {
  if (boardArray[guildId][channelId][posX][posY][3] == 0) {
    findMines(guildId, channelId, posX, posY, xMax, yMax);
    floodFill(guildId, channelId, posX + 1, posY);
    floodFill(guildId, channelId, posX + 1, posY + 1);
    floodFill(guildId, channelId, posX, posY + 1);
    floodFill(guildId, channelId, posX - 1, posY + 1);
    floodFill(guildId, channelId, posX - 1, posY);
    floodFill(guildId, channelId, posX - 1, posY - 1);
    floodFill(guildId, channelId, posX, posY - 1);
    floodFill(guildId, channelId, posX + 1, posY - 1);
  } else {
    return;
  }
}
function findMines(guildId, channelId, posX, posY, xMax, yMax) {
  var count = 0;
  var mineCount = 0;
  var pos = [0, 0, 0, 0, 0, 0, 0, 0]; // Top left, going clockwise
  if (posX == 0 && posY == 0) {
    pos = [0, 0, 0, 1, 1, 1, 0, 0]; // Tl
  } else if (posX == xMax && posY == 0) {
    pos = [0, 0, 0, 0, 0, 1, 1, 1]; // TR
  } else if (posX == 0 && posY == yMax) {
    pos = [0, 1, 1, 1, 0, 0, 0, 0]; // BL
  } else if (posX == xMax && posY == yMax) {
    pos = [1, 1, 0, 0, 0, 0, 0, 1]; // BR
  } else if (posX == 0) {
    pos = [0, 0, 0, 1, 1, 1, 1, 1]; // T
  } else if (posX == xMax) {
    pos = [1, 1, 1, 1, 0, 0, 0, 1]; // B
  } else if (posY == 0) {
    pos = [0, 1, 1, 1, 1, 1, 0, 0]; // L
  } else if (posY == yMax) {
    pos = [1, 1, 0, 0, 0, 1, 1, 1]; // R
  } else {
    pos = [1, 1, 1, 1, 1, 1, 1, 1];
  } // and that is how NOT to code.
  for (var i = 0; i < 8; i++) {
    if (pos[i] == 0) {
      continue;
    } else {
      // boardArray[guildId][channelId][posX][posY][3] = 1
      switch (i) {
        case 0:
          count += boardArray[guildId][channelId][posX + 1][posY - 1][2];
          if (boardArray[guildId][channelId][posX + 1][posY - 1][2] != 0) {
            mineCount++;
          }
          break;
        case 1:
          count += boardArray[guildId][channelId][posX - 1][posY][2];
          if (boardArray[guildId][channelId][posX - 1][posY][2] != 0) {
            mineCount++;
          }
          break;
        case 2:
          count += boardArray[guildId][channelId][posX - 1][posY + 1][2];
          if (boardArray[guildId][channelId][posX - 1][posY + 1][2] != 0) {
            mineCount++;
          }
          break;
        case 3:
          count += boardArray[guildId][channelId][posX][posY + 1][2];
          if (boardArray[guildId][channelId][posX][posY + 1][2] != 0) {
            mineCount++;
          }
          break;
        case 4:
          count += boardArray[guildId][channelId][posX + 1][posY + 1][2];
          if (boardArray[guildId][channelId][posX + 1][posY + 1][2] != 0) {
            mineCount++;
          }
          break;
        case 5:
          count += boardArray[guildId][channelId][posX + 1][posY][2];
          if (boardArray[guildId][channelId][posX + 1][posY][2] != 0) {
            mineCount++;
          }
          break;
        case 6:
          count += boardArray[guildId][channelId][posX + 1][posY - 1][2];
          if (boardArray[guildId][channelId][posX + 1][posY - 1][2] != 0) {
            mineCount++;
          }
          break;
        case 7:
          count += boardArray[guildId][channelId][posX][posY - 1][2];
          if (boardArray[guildId][channelId][posX][posY - 1][2] != 0) {
            mineCount++;
          }
          break;
      }
      if (mineCount > 0) {
        boardArray[guildId][channelId][posX][posY][3] = 1;
        boardsArray[guildId][channelId][posX][posY][4] = count;
      }
      floodFill(guildId, channelId, posX, posY, xMax, yMax);
    }
  }
}
function randomMine() {
  return Math.floor(Math.random() * 4 + 1);
}
function flagToInt(flagType) {
  if (flagType.toLowerCase() == "s") {
    return 1;
  } else if (flagType.toLowerCase() == "d") {
    return 2;
  } else if (flagType.toLowerCase() == "t") {
    return 3;
  } else if (flagType.toLowerCase() == "a") {
    return 4;
  } else {
    throw new Error("Error: Invalid flag type");
  }
}

function drawGrid(guildId, channelId) {
  // still need to finish lol
  var xSize = boardArray[guildId][channelId][255][0];
  var ySize = boardArray[guildId][channelId][255][1];
  var mines = [
    boardArray[guildId][channelId][255][2],
    boardArray[guildId][channelId][255][3],
    boardArray[guildId][channelId][255][4],
    boardArray[guildId][channelId][255][5]
  ];

  for (var i = 0; i < xSize; i++) {}
}

// past here is copied code
function cellA1ToIndex(cellA1, index) {
  // Ensure index is (default) 0 or 1, no other values accepted.
  index = index || 0;
  index = index == 0 ? 0 : 1;

  // Use regex match to find column & row references.
  // Must start with letters, end with numbers.
  // This regex still allows induhviduals to provide illegal strings like "AB.#%123"
  var match = cellA1.match(/(^[A-Z]+)|([0-9]+$)/gm);

  if (match.length != 2) throw new Error("Error: Invalid cell reference");

  var colA1 = match[0];
  var rowA1 = match[1];

  return { row: rowA1ToIndex(rowA1, index), col: colA1ToIndex(colA1, index) };
}
function colA1ToIndex(colA1, index) {
  if (typeof colA1 !== "string" || colA1.length > 2)
    throw new Error("Expected column label.");

  // Ensure index is (default) 0 or 1, no other values accepted.
  index = index || 0;
  index = index == 0 ? 0 : 1;

  var A = "A".charCodeAt(0);

  var number = colA1.charCodeAt(colA1.length - 1) - A;
  if (colA1.length == 2) {
    number += 26 * (colA1.charCodeAt(0) - A + 1);
  }
  return number + index;
}
function rowA1ToIndex(rowA1, index) {
  // Ensure index is (default) 0 or 1, no other values accepted.
  index = index || 0;
  index = index == 0 ? 0 : 1;

  return rowA1 - 1 + index;
}
// login stuffs
client.login(tokenfile.token);
