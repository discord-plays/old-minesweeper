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
  "xbomb-a"
];

class MinesweeperBoard {
  constructor(board,width,height) {
    this.b=board;
    this.w=width;
    this.h=height;
  }
  render(callback) {
    var t=this;
    Jimp.read("minesweeper-icons.png").then(iconsimg => {
      t.iconsimg=iconsimg;
      var r=new Jimp(16*this.w,16*this.h,(err,baseimg)=>{
        if(err) throw err;
        this.b.forEach((row,y)=>{
          row.forEach((icontype,x)=>{
            baseimg.composite(t.getIcon(icontype),x*16,y*16);
          });
        });
        baseimg.resize(this.w*64,Jimp.AUTO,Jimp.RESIZE_NEAREST_NEIGHBOR).getBuffer(Jimp.MIME_PNG, (error, result) => {
          if(error) throw error;
          callback(result);
        });
      });
    });
  }

  getIcon(name) {
    var img = this.iconsimg;
    var i=minesweeperIconsMap.indexOf(name);
    return img.clone().crop((i%10)*16,Math.floor(i/10)*16,16,16);
  }
}

module.exports={MinesweeperBoard:MinesweeperBoard};
