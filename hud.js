class HUD {
  constructor(player, map) {
    this.player = player;
    this.map = map;
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    //---Coin count---
    ctx.font = (30 * scale) + "px sans-serif";
    var txt = "x " + this.player.coinCount;
    var w = ctx.measureText(txt).width;
    var xc = ctx.canvas.width - (70 * scale) - w;
    var yc = 10;
    if(imgLoaded(imgs.coin)) {
      ctx.drawImage(imgs.coin, xc, yc, 50 * scale, 50 * scale);
    }
    ctx.fillStyle = "black";
    ctx.fillText(txt, xc + (60 * scale), yc + (40 * scale));
  }
}
