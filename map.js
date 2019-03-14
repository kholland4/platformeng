class GameObject {
  constructor() {
    
  }
  
  kwarg(kwargs, name, defaultValue) {
    if(name in kwargs) {
      this[name] = kwargs[name];
    } else {
      this[name] = defaultValue;
    }
  }
  
  serialize() {
    var data = {};
    for(var key in this) {
      if(typeof this[key] != "undefined" && typeof this[key] != "function" && !(typeof this[key] == "object" && this[key].constructor.name != "Object")) {
        data[key] = this[key];
      }
    }
    return data;
  }
  
  static deserialize(data) {
    var obj = new this();
    for(var key in data) {
      obj[key] = data[key];
    }
    return obj;
  }
  
  setCenter(d) {
    this.x = Math.round(d.x);
    this.y = Math.round(d.y);
  }
  
  getCenter() {
    return {"x": this.x, "y": this.y};
  }
}

class Box extends GameObject {
  constructor(x, y, w, h, kwargs={}) {
    super();
    
    this.x = x;
    this.y = y;
    this.origX = x;
    this.origY = y;
    this.deltaX = 0;
    this.deltaY = 0;
    this.w = w;
    this.h = h;
    
    this.solid = true;
    
    this.kwarg(kwargs, "animFunc");
    this.kwarg(kwargs, "bouncy", false);
    this.kwarg(kwargs, "sticky", false);
    this.kwarg(kwargs, "color", "red");
    this.kwarg(kwargs, "death", false);
    
    var defaultTex = imgs.block;
    if(this.sticky) { defaultTex = imgs.slime; }
    this.kwarg(kwargs, "tex", defaultTex);
  }
  
  collide(box) {
    if(box.x < this.x + this.w && box.x + box.w > this.x && box.y < this.y + this.h && box.y + box.h > this.y) {
      return true;
    }
    return false;
  }
  
  animate(time, timeScale) {
    if(this.animFunc != undefined) {
      var oldX = this.x;
      var oldY = this.y;
      if(typeof this.animFunc == "function") {
        this.animFunc(this, time);
      } else {
        if(this.animFunc.x != undefined) {
          var offset = this.animFunc.x.offset || 0; var rate = this.animFunc.x.rate || 1; var range = this.animFunc.x.range || 100;
          var idx = (((time + offset) / 1000) * rate) % (Math.PI * 2);
          this.x = this.origX + Math.round(Math.sin(idx) * range);
        }
        if(this.animFunc.y != undefined) {
          var offset = this.animFunc.y.offset || 0; var rate = this.animFunc.y.rate || 1; var range = this.animFunc.y.range || 100;
          var idx = (((time + offset) / 1000) * rate) % (Math.PI * 2);
          this.y = this.origY + Math.round(Math.sin(idx) * range);
        }
      }
      this.deltaX = this.x - oldX;
      this.deltaY = this.y - oldY;
    }
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    var img = this.tex;
    if(imgLoaded(img)) {
      for(var x = 0; x < this.w / 50; x++) {
        for(var y = 0; y < this.h / 50; y++) {
          ctx.drawImage(img, (this.x - voffset.x + (x * 50)) * scale, (this.y - voffset.y + (y * 50)) * scale, 50 * scale, 50 * scale);
        }
      }
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect((this.x - voffset.x) * scale, (this.y - voffset.y) * scale, this.w * scale, this.h * scale);
    }
  }
  
  setCenter(d) {
    this.x = Math.round(d.x - (this.w / 2));
    this.y = Math.round(d.y - (this.h / 2));
    this.origX = this.x;
    this.origY = this.y;
  }
  
  getCenter() {
    return {"x": Math.round(this.x + (this.w / 2)), "y": Math.round(this.y + (this.h / 2))};
  }
  
  get texref() {
    return getImgIndex(this.tex) || "";
  }
  set texref(val) {
    if(val != null && val != "" && val in imgs) { this.tex = imgs[val]; }
  }
  
  get anim() {
    if(this.animFunc != undefined && typeof this.animFunc != "function") {
      return JSON.stringify(this.animFunc);
    }
    return "";
  }
  set anim(val) {
    if(val == "" || val == null) { return; }
    try {
      var d = JSON.parse(val);
      this.animFunc = d;
    } catch(e) {
      
    }
  }
}
Object.defineProperty(Box.prototype, "texref", {enumerable: true});
Object.defineProperty(Box.prototype, "anim", {enumerable: true});

class Coin extends GameObject {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
    this.color = "yellow";
    this.radius = 24;
    this.exists = true;
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
      y: this.y,
      exists: this.exists
    };
  }
  
  set state(data) {
    this.x = data.x;
    this.y = data.y;
    this.exists = data.exists;
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    if(!this.exists) { return; }
    
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
  
  collide(box) {
    return this.boundingBox().collide(box);
  }
}

class Portal extends GameObject {
  constructor(x, y, partner) {
    super();
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
  
  collide(box) {
    return this.boundingBox().collide(box);
  }
  
  interact(player) {
    var bbox = player.boundingBox();
    if(this.boundingBox().collide(bbox)) {
      var vec = player.getSpeed();
      var len = Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
      var tlen = (Math.max(bbox.w / 2, bbox.h / 2) + this.partner.radius) * 1.5;
      vec.x *= (tlen / len);
      vec.y *= (tlen / len);
      player.setPos(this.partner.x + vec.x, this.partner.y + vec.y);
    }
  }
}

class Entity extends GameObject {
  static get B_CONSTANT() { return 2; }
  static get B_PACING() { return 3; }
  
  constructor(x, y, sx=0, sy=0, behavior=Entity.B_CONSTANT, speedMul=2, map) {
    super();
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
  
  animate(time, timeScale) {
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
  
  setCenter(d) {
    this.pos.x = Math.round(d.x);
    this.pos.y = Math.round(d.y);
  }
  
  getCenter() {
    return {"x": this.pos.x, "y": this.pos.y};
  }
}

class Annotation extends GameObject {
  constructor(x, y, w, h, type="text", data="", kwargs={}) {
    super();
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.data = data;
    this.visible = true;
    
    this.kwarg(kwargs, "autoremove", false);
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
  
  boundingBox() {
    return new Box(this.x, this.y, this.w, this.h);
  }
  
  collide(map=this.map) {
    return map.collide(this.boundingBox());
  }
  
  get state() {
    return {
      "visible": this.visible
    };
  }
  
  set state(state) {
    this.visible = state.visible;
  }
  
  setCenter(d) {
    this.x = Math.round(d.x - (this.w / 2));
    this.y = Math.round(d.y - (this.h / 2));
  }
  
  getCenter() {
    return {"x": Math.round(this.x + (this.w / 2)), "y": Math.round(this.y + (this.h / 2))};
  }
  
  get imgref() {
    return getImgIndex(this.data) || "";
  }
  set imgref(val) {
    if(val != null && val != "" && val in imgs) { this.data = imgs[val]; }
  }
}
Object.defineProperty(Annotation.prototype, "imgref", {enumerable: true});

class Map {
  static OBJ_STATIC = 2;
  static OBJ_TRACKED = 3;
  static OBJ_UNTRACKED = 4;
  
  constructor() {
    this.sobjects = [];
    this.tobjects = [];
    this.uobjects = [];
    
    this.background = undefined;
  }
  
  addObject(obj, type=Map.OBJ_TRACKED) {
    if(type == Map.OBJ_STATIC) { this.sobjects.push(obj); } else
    if(type == Map.OBJ_TRACKED) { this.tobjects.push(obj); } else
    if(type == Map.OBJ_UNTRACKED) { this.uobjects.push(obj); }
  }
  
  autoAddObject(obj) {
    if(obj instanceof Box) {
      this.addObject(obj, Map.OBJ_STATIC);
      this.lastBox = obj;
    } else if(obj instanceof Coin) {
      this.addObject(obj);
    } else if(obj instanceof Portal) {
      this.addObject(obj, Map.OBJ_STATIC);
    } else if(obj instanceof Entity) {
      obj.map = this;
      this.addObject(obj);
    } else if(obj instanceof Annotation) {
      this.addObject(obj);
    } else {
      this.addObject(obj);
    }
  }
  
  addBox(box) {
    this.addObject(box, Map.OBJ_STATIC);
    this.lastBox = box;
  }
  
  addCoin(coin) {
    this.addObject(coin);
  }
  
  addPortal(p1, p2) {
    p1.partner = p2;
    p2.partner = p1;
    this.addObject(p1, Map.OBJ_STATIC);
    this.addObject(p2, Map.OBJ_STATIC);
  }
  
  addEntity(entity) {
    entity.map = this;
    this.addObject(entity);
  }
  
  addAnnotation(annotation) {
    this.addObject(annotation);
  }
  
  collide(box, needSolid=true) {
    var o = [this.sobjects, this.tobjects, this.uobjects];
    for(var n = 0; n < o.length; n++) {
      for(var i = 0; i < o[n].length; i++) {
        if("collide" in o[n][i] && (o[n][i].solid === true || !needSolid)) {
          if(o[n][i].collide(box)) {
            return o[n][i];
          }
        }
      }
    }
    return false;
  }
  
  animate(time, timeScale, controls=this.controls) {
    var o = [this.sobjects, this.tobjects, this.uobjects];
    for(var n = 0; n < o.length; n++) {
      for(var i = 0; i < o[n].length; i++) {
        if("animate" in o[n][i]) {
          o[n][i].animate(time, timeScale);
        }
      }
    }
    
    if(controls != undefined) {
      if(controls.any) {
        for(var i = 0; i < this.tobjects.length; i++) {
          if(this.tobjects[i] instanceof Annotation) {
            this.tobjects[i].autohide();
          }
        }
      }
    }
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    var dw = ctx.canvas.width;
    var dh = ctx.canvas.height;
    
    var tile = this.background;
    if(tile != undefined) {
      if(imgLoaded(tile)) {
        var tileW = 512;
        var tileH = 512;
        
        var xmin = Math.floor(voffset.x / tileW) * tileW;
        var ymin = Math.floor(voffset.y / tileH) * tileH;
        
        var xmax = Math.ceil((voffset.x + (dw * (1 / scale))) / tileW) * tileW;
        var ymax = Math.ceil((voffset.y + (dh * (1 / scale))) / tileH) * tileH;
        
        for(var x = xmin; x < xmax; x += tileW) {
          for(var y = ymin; y < ymax; y += tileH) {
            ctx.drawImage(tile, (x - voffset.x) * scale, (y - voffset.y) * scale, tileW * scale, tileH * scale);
          }
        }
      }
    }
    
    var vwin = new Box(voffset.x, voffset.y, dw * (1 / scale), dh * (1 / scale));
    
    var o = [this.sobjects, this.tobjects, this.uobjects];
    for(var n = 0; n < o.length; n++) {
      for(var i = 0; i < o[n].length; i++) {
        if("draw" in o[n][i]) {
          if("collide" in o[n][i]) { if(!o[n][i].collide(vwin)) { continue; } }
          o[n][i].draw(ctx, voffset, scale);
        }
      }
    }
  }
  
  gatherCoins(player) {
    var bbox = player.boundingBox();
    var coinCount = 0;
    var o = [this.sobjects, this.tobjects, this.uobjects];
    for(var n = 0; n < o.length; n++) {
      for(var i = 0; i < o[n].length; i++) {
        if(o[n][i] instanceof Coin) {
          if(o[n][i].boundingBox().collide(bbox) && o[n][i].exists) {
            o[n][i].exists = false;
            coinCount++;
          }
        }
      }
    }
    return coinCount;
  }
  
  interact(player) {
    var bbox = player.boundingBox();
    for(var i = 0; i < this.sobjects.length; i++) {
      if("interact" in this.sobjects[i]) {
        this.sobjects[i].interact(player);
      }
    }
  }
  
  get state() {
    var tData = [];
    for(var i = 0; i < this.tobjects.length; i++) {
      if("state" in this.tobjects[i]) {
        tData.push(this.tobjects[i].state);
      } else {
        tData.push(false);
      }
    }
    var data = {data: tData};
    if(this.controls != undefined) {
      data.controls = JSON.parse(JSON.stringify(this.controls));
    }
    return data;
  }
  
  set state(d) {
    var data = d.data;
    for(var i = 0; i < Math.min(this.tobjects.length, data.length); i++) {
      if("state" in this.tobjects[i]) {
        this.tobjects[i].state = data[i];
      }
    }
  }
  
  serialize() {
    var sdata = {};
    var d = [];
    var o = [this.sobjects, this.tobjects, this.uobjects];
    for(var n = 0; n < o.length; n++) {
      var sec = [];
      for(var i = 0; i < o[n].length; i++) {
        sec.push({"type": o[n][i].constructor.name, "data": o[n][i].serialize()});
      }
      d.push(sec);
    }
    sdata.objects = d;
    
    var val = getImgIndex(this.background); if(val != undefined) { sdata.background = val; }
    
    return sdata;
  }
  
  static deserialize(sdata) {
    var obj = new Map();
    var d = sdata.objects;
    var o = ["sobjects", "tobjects", "uobjects"];
    for(var n = 0; n < d.length; n++) {
      for(var i = 0; i < d[n].length; i++) {
        var data = d[n][i];
        var classType = null;
        var classes = [Box, Coin, Portal, Entity, Annotation];
        for(var x = 0; x < classes.length; x++) {
          if(classes[x].name == data.type) {
            classType = classes[x];
            break;
          }
        }
        if(classType != null) {
          var gObj = classType.deserialize(data.data);
          if(gObj instanceof Entity) { gObj.map = obj; }
          obj[o[n]].push(gObj);
        }
      }
    }
    
    if("background" in sdata) { obj.background = imgs[sdata.background]; }
    
    return obj;
  }
}
