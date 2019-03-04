class Box {
  constructor(x, y, w, h, kwargs={}) {
    this.x = x;
    this.y = y;
    this.origX = x;
    this.origY = y;
    this.deltaX = 0;
    this.deltaY = 0;
    this.w = w;
    this.h = h;
    
    this.kwarg(kwargs, "animFunc");
    this.kwarg(kwargs, "bouncy", false);
    this.kwarg(kwargs, "sticky", false);
    this.kwarg(kwargs, "color", "red");
  }
    
  kwarg(kwargs, name, defaultValue) {
    if(name in kwargs) {
      this[name] = kwargs[name];
    } else {
      this[name] = defaultValue;
    }
  }
  
  collide(box) {
    if(box.x < this.x + this.w && box.x + box.w > this.x && box.y < this.y + this.h && box.y + box.h > this.y) {
      return true;
    }
    return false;
  }
  
  animate(time) {
    if(this.animFunc != undefined) {
      var oldX = this.x;
      var oldY = this.y;
      this.animFunc(this, time);
      this.deltaX = this.x - oldX;
      this.deltaY = this.y - oldY;
    }
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    ctx.fillStyle = this.color;
    ctx.fillRect((this.x - voffset.x) * scale, (this.y - voffset.y) * scale, this.w * scale, this.h * scale);
  }
}

class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.color = "yellow";
    this.radius = 20;
  }
  
  static fromBox(box, idx=1, qty=1) {
    var c = new Coin();
    c.x = box.x + (box.w / (qty + 1)) * idx;
    c.y = box.y - c.radius - 10;
    return c;
  }
  
  get state() {
    return {
      x: this.x,
      y: this.y
    };
  }
  
  set state(data) {
    this.x = data.x;
    this.y = data.y;
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    if(imgLoaded(imgs.coin)) {
      ctx.drawImage(imgs.coin, (this.x - voffset.x - this.radius) * scale, (this.y - voffset.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
    } else {
      ctx.beginPath();
      ctx.arc((this.x - voffset.x) * scale, (this.y - voffset.y) * scale, this.radius * scale, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }
  
  boundingBox() {
    return new Box(Math.round(this.x) - this.radius, Math.round(this.y) - this.radius, this.radius * 2, this.radius * 2);
  }
}

class Portal {
  constructor(x, y, partner) {
    this.x = x;
    this.y = y;
    this.radius = 75;
    this.color = "black";
    this.partner = partner;
    if(partner == undefined) {
      this.partner = new Portal(0, 0, this);
    }
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    if(imgLoaded(imgs.portal)) {
      ctx.drawImage(imgs.portal, (this.x - voffset.x - this.radius) * scale, (this.y - voffset.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
    } else {
      ctx.beginPath();
      ctx.arc((this.x - voffset.x) * scale, (this.y - voffset.y) * scale, this.radius * scale, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }
  
  boundingBox() {
    return new Box(Math.round(this.x) - this.radius, Math.round(this.y) - this.radius, this.radius * 2, this.radius * 2);
  }
}

class Entity {
  static get B_CONSTANT() { return 2; }
  static get B_PACING() { return 3; }
  
  constructor(x, y, sx=0, sy=0, behavior=Entity.B_CONSTANT, speedMul=2, map) {
    this.map = map;
    
    this.behavior = behavior;
    
    this.pos = {"x": x, "y": y};
    this.speed = {"x": sx * speedMul, "y": sy * speedMul};
    this.ospeed = {"x": sx * speedMul, "y": sy * speedMul};
    
    this.gravity = {"x": 0, "y": 800 * speedMul};
    this.realMaxSpeed = {"x": 500 * speedMul, "y": 500 * speedMul};
    
    this.canJump = false;
    this.jumpSpeed = {"x": 0, "y": -800};
    
    this.drawData = {"radius": 20};
  }
  
  static fromBox(box, sx=0, sy=0, behavior=Entity.B_CONSTANT) {
    var e = new Entity(0, 0, sx, sy, behavior);
    e.pos.x = box.x + (box.w / 2);
    e.pos.y = box.y - e.drawData.radius;
    return e;
  }
  
  animate(timeScale) {
    //---Controls---
    if(this.behavior == Entity.B_PACING && this.contactBox != undefined) {
      if(this.pos.x - this.drawData.radius < this.contactBox.x) {
        this.speed.x = this.ospeed.x;
      } else if(this.pos.x + this.drawData.radius > this.contactBox.x + this.contactBox.w) {
        this.speed.x = -this.ospeed.x;
      }
      if(this.speed.x == 0) {
        this.speed.x = this.ospeed.x;
      }
    }
    
    //---Gravity---
    this.speed.x += this.gravity.x * timeScale;
    this.speed.y += this.gravity.y * timeScale;
    
    //---Contstraints---
    this.speed.x = Math.min(Math.max(this.speed.x, -this.realMaxSpeed.x), this.realMaxSpeed.x);
    this.speed.y = Math.min(Math.max(this.speed.y, -this.realMaxSpeed.y), this.realMaxSpeed.y);
    
    var cSpeed = {"x": 0, "y": 0};
    if(this.contactBox != undefined) {
      cSpeed.x = this.contactBox.deltaX;
      cSpeed.y = this.contactBox.deltaY;
    }
    
    //---Moving with box entity is on---
    this.pos.x += cSpeed.x;
    this.pos.y += cSpeed.y;
    
    //---Actual motion + jumping logic---
    
    //---X axis---
    this.pos.x += this.speed.x * timeScale;
    var c = this.collide();
    if(c) {
      this.contactBox = c;
      this.pos.x -= this.speed.x * timeScale * (1 + cSpeed.x * 0.1);
      if(!c.bouncy) {
        this.speed.x = this.speed.x * -0.5;
      } else {
        this.speed.x = this.speed.x * -1.5;
      }
    }
    
    //---Y axis---
    this.canJump = false;
    this.pos.y += this.speed.y * timeScale;
    var c = this.collide();
    if(c) {
      this.contactBox = c;
      this.pos.y -= this.speed.y * timeScale;
      if(!c.bouncy) {
        if(this.speed.y > 0) {
          this.canJump = true;
        }
        this.speed.y = 0;
      } else {
        this.speed.y *= -1.5;
      }
      //FIXME: real solution
      var i = 0;
      while(this.collide() && i < 50) {
        this.pos.y -= 10;
        i++;
      }
    }
  }
  
  collide(map=this.map) {
    return map.collide(this.boundingBox());
  }
  
  boundingBox() {
    return new Box(Math.round(this.pos.x) - this.drawData.radius, Math.round(this.pos.y) - this.drawData.radius, this.drawData.radius * 2, this.drawData.radius * 2);
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    var xc = (this.pos.x - voffset.x) * scale;
    var yc = (this.pos.y - voffset.y) * scale;
    
    ctx.beginPath();
    ctx.arc(xc, yc, this.drawData.radius * scale, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
  }
  
  get state() {
    return {
      pos: {"x": this.pos.x, "y": this.pos.y},
      speed: {"x": this.speed.x, "y": this.speed.y},
      ospeed: {"x": this.ospeed.x, "y": this.ospeed.y},
      canJump: this.canJump,
      behavior: this.behavior
    };
  }
  
  set state(state) {
    this.pos.x = state.pos.x;
    this.pos.y = state.pos.y;
    this.speed.x = state.speed.x;
    this.speed.y = state.speed.y;
    this.ospeed.x = state.ospeed.x;
    this.ospeed.y = state.ospeed.y;
    this.canJump = state.canJump;
    this.behavior = state.behavior;
  }
}

class Annotation {
  constructor(x, y, w, h, type="text", data="", kwargs={}) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.data = data;
    this.visible = true;
    
    this.kwarg(kwargs, "autoremove", false);
  }
    
  kwarg(kwargs, name, defaultValue) {
    if(name in kwargs) {
      this[name] = kwargs[name];
    } else {
      this[name] = defaultValue;
    }
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    if(!this.visible) {
      return;
    }
    
    var xc = (this.x - voffset.x) * scale;
    var yc = (this.y - voffset.y) * scale;
    
    if(this.type == "text") {
      
    } else if(this.type == "image") {
      if(imgLoaded(this.data)) {
        ctx.drawImage(this.data, xc, yc, this.w * scale, this.h * scale);
      }
    }
  }
  
  autohide() {
    if(this.autoremove) {
      this.visible = false;
    }
  }
  
  get state() {
    return {
      "visible": this.visible
    };
  }
  
  set state(state) {
    this.visible = state.visible;
  }
}

class Map {
  constructor() {
    this.boxes = [];
    this.coins = [];
    this.portals = [];
    this.entities = [];
    this.annotations = [];
  }
  
  addBox(box) {
    this.boxes.push(box);
    this.lastBox = box;
  }
  
  addCoin(coin) {
    this.coins.push(coin);
  }
  
  addPortal(p1, p2) {
    p1.partner = p2;
    p2.partner = p1;
    this.portals.push(p1);
    this.portals.push(p2);
  }
  
  addEntity(entity) {
    entity.map = this;
    this.entities.push(entity);
  }
  
  addAnnotation(annotation) {
    this.annotations.push(annotation);
  }
  
  collide(box) {
    for(var i = 0; i < this.boxes.length; i++) {
      if(this.boxes[i].collide(box)) {
        return this.boxes[i];
      }
    }
    return false;
  }
  
  animate(time, timeScale, controls=this.controls) {
    for(var i = 0; i < this.boxes.length; i++) {
      this.boxes[i].animate(time);
    }
    
    for(var i = 0; i < this.entities.length; i++) {
      this.entities[i].animate(timeScale);
    }
    
    if(controls != undefined) {
      if(controls.any) {
        for(var i = 0; i < this.annotations.length; i++) {
          this.annotations[i].autohide();
        }
      }
    }
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    for(var i = 0; i < this.boxes.length; i++) {
      this.boxes[i].draw(ctx, voffset, scale);
    }
    
    for(var i = 0; i < this.coins.length; i++) {
      this.coins[i].draw(ctx, voffset, scale);
    }
    
    for(var i = 0; i < this.portals.length; i++) {
      this.portals[i].draw(ctx, voffset, scale);
    }
    
    for(var i = 0; i < this.entities.length; i++) {
      this.entities[i].draw(ctx, voffset, scale);
    }
    
    for(var i = 0; i < this.annotations.length; i++) {
      this.annotations[i].draw(ctx, voffset, scale);
    }
  }
  
  gatherCoins(player) {
    var bbox = player.boundingBox();
    var coinCount = 0;
    for(var i = 0; i < this.coins.length; i++) {
      if(this.coins[i].boundingBox().collide(bbox)) {
        this.coins.splice(i, 1);
        i--;
        coinCount++;
      }
    }
    return coinCount;
  }
  
  interact(player) {
    var bbox = player.boundingBox();
    for(var i = 0; i < this.portals.length; i++) {
      if(this.portals[i].boundingBox().collide(bbox)) {
        var vec = player.getSpeed();
        var len = Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
        var tlen = (Math.max(bbox.w / 2, bbox.h / 2) + this.portals[i].partner.radius) * 1.5;
        vec.x *= (tlen / len);
        vec.y *= (tlen / len);
        player.setPos(this.portals[i].partner.x + vec.x, this.portals[i].partner.y + vec.y);
        break;
      }
    }
  }
  
  get state() {
    var coinData = [];
    for(var i = 0; i < this.coins.length; i++) {
      coinData.push(this.coins[i].state);
    }
    var entityData = [];
    for(var i = 0; i < this.entities.length; i++) {
      entityData.push(this.entities[i].state);
    }
    var annotationData = [];
    for(var i = 0; i < this.annotations.length; i++) {
      annotationData.push(this.annotations[i].state);
    }
    var data = {coins: coinData, entities: entityData, annotations: annotationData};
    if(this.controls != undefined) {
      data.controls = JSON.parse(JSON.stringify(this.controls));
    }
    return data;
  }
  
  set state(d) {
    var data = d.coins;
    this.coins = [];
    for(var i = 0; i < data.length; i++) {
      var c = new Coin();
      c.state = data[i];
      this.coins.push(c);
    }
    
    var data = d.entities;
    //this.entities = [];
    for(var i = 0; i < Math.min(this.entities.length, data.length); i++) {
      /*var c = new Entity();
      c.map = this;
      c.state = data[i];
      this.entities.push(c);*/
      this.entities[i].state = data[i];
    }
    
    var data = d.annotations;
    for(var i = 0; i < Math.min(this.annotations.length, data.length); i++) {
      this.annotations[i].state = data[i];
    }
  }
}
