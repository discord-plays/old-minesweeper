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
    this.board = board;
    this.width = width;
    this.height = height;
  }
  render(callback) {
    var t = this;
    Jimp.read("minesweeper-icons.png").then(iconsimg => {
      t.iconsimg = iconsimg;
      var r = new Jimp(16 * (this.width + 2), 16 * (this.height + 2), (err, baseimg) => {
        if (err) throw err;
        this.board.forEach((row, y) => {
          row.forEach((icontype, x) => {
            baseimg.composite(t.getIcon(icontype), (1 + x) * 16, (1 + y) * 16);
          });
        });
        var cornerIcon = t.getIcon("corner");
        baseimg.composite(cornerIcon, 0, 0);
        baseimg.composite(cornerIcon, (this.width + 1) * 16, 0);
        baseimg.composite(cornerIcon, 0, (this.height + 1) * 16);
        baseimg.composite(cornerIcon, (this.width + 1) * 16, (this.height + 1) * 16);

        var sidebaseIcon = t.getIcon("sidebase");
        for (var x = 0; x < this.width; x++) {
          var a = letterVal(x).toLowerCase();
          var b = "a".charCodeAt(0);
          if (a.length == 1) {
            var letterIcon = t.getIcon("letter-" + a);
            // top letter
            baseimg.composite(letterIcon, (1 + x) * 16, 0);
            // bottom letter
            baseimg.composite(letterIcon, (1 + x) * 16, (this.height + 1) * 16);
          } else if (a.length == 2) {
            // top letter
            var sidebaseLeftIcon = t.getMiniIcon(a.charCodeAt(0) - b);
            var sidebaseRightIcon = t.getMiniIcon(a.charCodeAt(1) - b);
            baseimg.composite(sidebaseIcon, (1 + x) * 16, 0);
            baseimg.composite(sidebaseLeftIcon, (1 + x) * 16 + 2, 3);
            baseimg.composite(sidebaseRightIcon, (1 + x) * 16 + 9, 3);
            // bottom letter
            baseimg.composite(sidebaseIcon, (1 + x) * 16, (this.height + 1) * 16);
            baseimg.composite(sidebaseLeftIcon, (1 + x) * 16 + 2, (this.height + 1) * 16 + 3);
            baseimg.composite(sidebaseRightIcon, (1 + x) * 16 + 9, (this.height + 1) * 16 + 3);
          }
        }
        for (var y = 0; y < this.height; y++) {
          if (y < 9) {
            var numberIcon = t.getIcon("number-" + (y + 1));
            // left number
            baseimg.composite(numberIcon, 0, (1 + y) * 16);
            // right number
            baseimg.composite(numberIcon, (this.width + 1) * 16, (1 + y) * 16);
          } else {
            var sidebaseLeftNumber = t.getMiniIcon((Math.floor((y + 1) / 10) % 10) + 26);
            var sidebaseRightNumber = t.getMiniIcon(((y + 1) % 10) + 26);
            // left number
            baseimg.composite(t.getIcon("sidebase"), 0, (1 + y) * 16);
            baseimg.composite(sidebaseLeftNumber, 2, (1 + y) * 16 + 3);
            baseimg.composite(sidebaseRightNumber, 9, (1 + y) * 16 + 3);
            // right number
            baseimg.composite(t.getIcon("sidebase"), (this.width + 1) * 16, (1 + y) * 16);
            baseimg.composite(sidebaseLeftNumber, (this.width + 1) * 16 + 2, (1 + y) * 16 + 3);
            baseimg.composite(sidebaseRightNumber, (this.width + 1) * 16 + 9, (1 + y) * 16 + 3);
          }
        }
        baseimg.resize(this.width * 64, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR).getBuffer(Jimp.MIME_PNG, (error, result) => {
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
    return img.clone().crop((i % 13) * 6 + 5 * 16, Math.floor(i / 13) * 10 + 7 * 16, 6, 10);
  }
}

// https://stackoverflow.com/a/32007970/10719432
function letterVal(i) {
  return (i >= 26 ? letterVal(((i / 26) >> 0) - 1) : "") + "abcdefghijklmnopqrstuvwxyz"[i % 26 >> 0];
}

module.exports = { MinesweeperBoard: MinesweeperBoard };
