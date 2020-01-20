const Jimp = require("jimp");

// order of icon names
// start at top left
// each row from left to right
const minesweeperIconsMap = [
  // first row
  "cell0",
  "cell1",
  "cell2",
  "cell3",
  "cell4",
  "cell5",
  "cell6",
  "cell7",
  "cell8",
  "cell9",
  // second row
  "cell10",
  "cell11",
  "cell12",
  "cell13",
  "cell14",
  "cell15",
  "cell16",
  "cell17",
  "cell18",
  "cell19",
  // third row
  "cell20",
  "cell21",
  "cell22",
  "cell23",
  "cell24",
  "cell-1",
  "cell-2",
  "cell-3",
  "cell-4",
  "cell-5",
  // fourth row
  "cell-6",
  "cell-7",
  "cell-8",
  "blank",
  "hidden",
  "flag-s",
  "flag-d",
  "flag-t",
  "flag-a",
  "bomb-s",
  // fifth row
  "bomb-d",
  "bomb-t",
  "bomb-a",
  "xbomb-s",
  "xbomb-d",
  "xbomb-t",
  "xbomb-a",
  "corner",
  "letter-a",
  "letter-b",
  // sixth row
  "letter-c",
  "letter-d",
  "letter-e",
  "letter-f",
  "letter-g",
  "letter-h",
  "letter-i",
  "letter-j",
  "letter-k",
  "letter-l",
  // seventh row
  "letter-m",
  "letter-n",
  "letter-o",
  "letter-p",
  "letter-q",
  "letter-r",
  "letter-s",
  "letter-t",
  "letter-u",
  "letter-v",
  // eighth row
  "letter-w",
  "letter-x",
  "letter-y",
  "letter-z",
  "sidebase",
  "",
  "",
  "",
  "",
  "",
  // ninth row
  "number-1",
  "number-2",
  "number-3",
  "number-4",
  "number-5",
  "",
  "",
  "",
  "",
  "",
  // tenth row
  "number-6",
  "number-7",
  "number-8",
  "number-9"
];

class MinesweeperBoard {
  constructor(board, width, height) {
    this.b = board;
    this.w = width;
    this.h = height;
  }
  render(callback) {
    var t = this;
    Jimp.read("minesweeper-icons.png").then(iconsimg => {
      t.iconsimg = iconsimg;
      var r = new Jimp(16 * (this.w + 1), 16 * (this.h + 1), (err, baseimg) => {
        if (err) throw err;
        this.b.forEach((row, y) => {
          row.forEach((icontype, x) => {
            baseimg.composite(t.getIcon(icontype), (1 + x) * 16, (1 + y) * 16);
          });
        });
        baseimg.composite(t.getIcon("corner"), 0, 0);
        for (var x = 0; x < this.w; x++) {
          var a = letterVal(x);
          if (a.length == 1) {
            baseimg.composite(t.getIcon("letter-" + a), (1 + x) * 16, 0);
          } else if (a.length == 2) {
            baseimg.composite(t.getIcon("sidebase"), (1 + x) * 16, 0);
            baseimg.composite(t.getMiniIcon(a.charCodeAt(0) - 65), (1 + x) * 16 + 2, 3);
            baseimg.composite(t.getMiniIcon(a.charCodeAt(0) - 65), (1 + x) * 16 + 9, 3);
          }
        }
        for (var y = 0; y < this.h; y++) {
          if (y < 9) {
            baseimg.composite(t.getIcon("number-" + (y+1)), 0, (1 + y) * 16);
          } else {
            baseimg.composite(t.getIcon("sidebase"), 0, (1 + y) * 16);
            baseimg.composite(t.getMiniIcon((Math.floor((y+1) / 10) % 10) + 26), 2, (1 + y) * 16 + 3);
            baseimg.composite(t.getMiniIcon(((y+1) % 10) + 26), 9, (1 + y) * 16 + 3);
          }
        }
        baseimg.resize(this.w * 64, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR).getBuffer(Jimp.MIME_PNG, (error, result) => {
          if (error) throw error;
          callback(result);
        });
      });
    });
  }

  getIcon(name) {
    var img = this.iconsimg;
    var i = minesweeperIconsMap.indexOf(name);
    return img.clone().crop((i % 10) * 16, Math.floor(i / 10) * 16, 16, 16);
  }
  getMiniIcon(i) {
    var img = this.iconsimg;
    return img.clone().crop((i % 13) * 6 + (5*16), Math.floor(i / 10) * 10 + (7*16),6,10);
  }
}

// https://stackoverflow.com/a/32007970/10719432
function letterVal(i) {
  return (i >= 26 ? letterVal(((i / 26) >> 0) - 1) : "") + "abcdefghijklmnopqrstuvwxyz"[i % 26 >> 0];
}

module.exports = { MinesweeperBoard: MinesweeperBoard };
