/*
  Discord Plays Minesweeper Bot
*/
const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
var jsonfile = require("./configs.json");
var tokenfile = require('./token.json');
var boardArray = []; // Guild Id, Channel Id, X, (255 is board params [xSize, ySize, sMines, dMines, tMines, aMines]) Y, [Uncovered, Flag type, Mine type, Has mines around, totol of surrounding mines]

client.on('ready', () => {
  console.log("DPMS Bot Beta v0.1");
  console.log("Initializing...");
  // init code here
  console.log("done");
});
client.on('message', (message) => {
  if (message.content.startsWith(">")) {
    processCommand(message);
  }
});

function processCommand(receivedMessage) { // wheeeeee copying code

    let fullCommand = receivedMessage.content.substr(1); // Remove the leading exclamation mark
    let splitCommand = fullCommand.split(" "); // Split the message up in to pieces for each space
    let primaryCommand = splitCommand[0]; // The first word directly after the exclamation is the command
    let arguments = splitCommand.slice(1); // All other words are arguments/parameters/options for the command

    if (primaryCommand == "help") {
      helpCommand();
    } else if (primaryCommand == "start") {
      startCommand();
    } else if (primaryCommand == "flag") {
      flagCommand();
    } else if (primaryCommand == "dig") {
      digCommand();
    } else {
      receivedMessage.channel.send("Unknown command. Use !help for help.");
    }

    /* else if (primaryCommand == "ruleset") {
      rulesetCommand();
    } */

} // add error functionality
function helpCommand() {
  return;
}
function startCommand(guildId, channelId, xSize, ySize, sMines, dMines, tMines, aMines) {
  if (xSize > 26 || ySize > 26) {
    throw new Error('Error: Board too big!');
  }
  if (dMines == undefined) {
    dMines = 0;
  }
  if (tMines == undefined) {
    tMines = 0;
  }
  if (aMines == undefined) {
    aMines = 0;
  }

  var sCount = 0, dCount = 0, tCount = 0, aCount = 0, randMine = 0;
  var totalMines = sMines + dMines + tMines + aMines;

  boardArray[guildId][channelId][255] = [xSize, ySize, sMines, dMines, tMines, aMines]
  var xRand = 0, yRand = 0;
  var regenMine = false;

  for (i = 0; i < xSize; i++) {
    for (j = 0; j < ySize; j++) {
      boardArray[guildId][channelId][i][j] = [0, 0, 0, 0]
    }
  }

  for (var i = 0; i < totalMines; i++) {
    xRand = Math.floor(Math.random(1,xSize));
    yRand = Math.floor(Math.random(1,ySize));
    while (regenMine == true) {
      randMine = randomMine();
      if (randMine = 1) {
        if (sCount = sMines) {
          regenMine = true;
        } else {
          sCount++;
          regenMine = false;
        }
      } else if (randMine = 2) {
        if (dCount = dMines) {
          regenMine = true;
        } else {
          dCount++;
          regenMine = false;
        }
      } else if (randMine = 3) {
        if (tCount = tMines) {
          regenMine = true;
        } else {
          tCount++;
          regenMine = false;
        }
      } else if (randMine = 4) {
        if (aCount = aMines) {
          regenMine = true;
        } else {
          aCount++;
          regenMine = false;
          randMine = -1;
        }
      } else {
        throw new Error('Error: Invalid Value for randMine')
      }
    }
    boardArray[guildId][channelId][xRand][yRand][2] == randMine;
  }
  // add code to make message here pls
}
function flagCommand(guildId, channelId, coord, flagType) { // coord is type string, such as 'A1' or 'G6' | flagType is type string, only 'S', 'D', 'T' or 'A' (case-insensitive)
  try {
    var newCoord = cellA1ToIndex(coord);
    var flagInt = flagToInt(flagType);
  } catch(err) {
    throw err;
  }

  var xMax = boardArray[guildId][channelId][255][0];
  var yMax = boardArray[guildId][channelId][255][1];

  if (boardArray[guildId][channelId][255] == undefined) {
    throw new Error('Error: No board');
  } else if ((newCoord.row > xMax) || (newCoord.col > yMax)) {
    throw new Error('Error: Outside board range');
  } else if (boardArray[guildId][channelId][newCoord.row][newCoord.col][0] == 1) {
    throw new Error('Error: Attempted to flag uncovered square');
  } else {
    if (boardArray[guildId][channelId][newCoord.row][newCoord.col][1] == 0) {
      boardArray[guildId][channelId][newCoord.row][newCoord.col][1] = flagInt;
    } else {
      boardArray[guildId][channelId][newCoord.row][newCoord.col][1] = 0
    }
  }
}
function digCommand(guildId, channelId, coord) {
  try {
    var newCoord = cellA1ToIndex(coord);
  } catch(err) {
    throw err;
  }
  var xMax = boardArray[guildId][channelId][255][0];
  var yMax = boardArray[guildId][channelId][255][1];

  if (boardArray[guildId][channelId][255] == undefined) {
    throw new Error('Error: No board');
  } else if ((newCoord.row > xMax) || (newCoord.col > yMax)) {
    throw new Error('Error: Outside board range');
  } else if (boardArray[guildId][channelId][newCoord.row][newCoord.col][1] > 0) {
    throw new Error('Error: Attempted to dig flagged square');
  } else if (boardArray[guildId][channelId][newCoord.row][newCoord.col][0] == 1) {
    throw new Error('Error: Square already uncovered');
  } else {
    // boardArray[guildId][channelId][newCoord.row][newCoord.col][1] =
    findMines(guildId, channelId, newCoord.row, newCoord.col, xMax, yMax);
  }
}

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
  var pos = [0,0,0,0,0,0,0,0] // Top left, going clockwise
  if (posX == 0 && posY == 0) {
    pos = [0,0,0,1,1,1,0,0] // Tl
  } else if (posX == xMax && posY == 0) {
    pos = [0,0,0,0,0,1,1,1] // TR
  } else if (posX == 0 && posY == yMax) {
    pos = [0,1,1,1,0,0,0,0] // BL
  } else if (posX == xMax && posY == yMax) {
    pos = [1,1,0,0,0,0,0,1] // BR
  } else if (posX == 0) {
    pos = [0,0,0,1,1,1,1,1] // T
  } else if (posX == xMax) {
    pos = [1,1,1,1,0,0,0,1] // B
  } else if (posY == 0) {
    pos = [0,1,1,1,1,1,0,0] // L
  } else if (posY == yMax) {
    pos = [1,1,0,0,0,1,1,1] // R
  } else {
    pos = [1,1,1,1,1,1,1,1]
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
  return Math.floor(Math.random(1,4));
}
function flagToInt(flagType) {
  if (flagType == 'S' || 's') {
    return 1;
  } else if (flagType == 'D' || 'd') {
    return 2;
  } else if (flagType == 'T' || 't') {
    return 3;
  } else if (flagType == 'A' || 'a') {
    return 4;
  } else {
    throw new Error('Error: Invalid flag type');
  }
}

function drawGrid(guildId, channelId) { // still need to finish lol
  var xSize = boardArray[guildId][channelId][255][0];
  var ySize = boardArray[guildId][channelId][255][1];
  var mines = [boardArray[guildId][channelId][255][2], boardArray[guildId][channelId][255][3], boardArray[guildId][channelId][255][4], boardArray[guildId][channelId][255][5]];

  for (var i = 0; i < xSize; i++) {

  }

}

// past here is copied code
function cellA1ToIndex( cellA1, index ) {
  // Ensure index is (default) 0 or 1, no other values accepted.
  index = index || 0;
  index = (index == 0) ? 0 : 1;

  // Use regex match to find column & row references.
  // Must start with letters, end with numbers.
  // This regex still allows induhviduals to provide illegal strings like "AB.#%123"
  var match = cellA1.match(/(^[A-Z]+)|([0-9]+$)/gm);

  if (match.length != 2) throw new Error( "Error: Invalid cell reference" );

  var colA1 = match[0];
  var rowA1 = match[1];

  return { row: rowA1ToIndex( rowA1, index ),
           col: colA1ToIndex( colA1, index ) };
}
function colA1ToIndex( colA1, index ) {
  if (typeof colA1 !== 'string' || colA1.length > 2)
    throw new Error( "Expected column label." );

  // Ensure index is (default) 0 or 1, no other values accepted.
  index = index || 0;
  index = (index == 0) ? 0 : 1;

  var A = "A".charCodeAt(0);

  var number = colA1.charCodeAt(colA1.length-1) - A;
  if (colA1.length == 2) {
    number += 26 * (colA1.charCodeAt(0) - A + 1);
  }
  return number + index;
}
function rowA1ToIndex( rowA1, index ) {
  // Ensure index is (default) 0 or 1, no other values accepted.
  index = index || 0;
  index = (index == 0) ? 0 : 1;

  return rowA1 - 1 + index;
}
// login stuffs
client.login(tokenfile.token);
