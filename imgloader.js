var imgs = {};
var imgURLs = [
  ["coin", "coin.png"],
  ["portal", "portal.png"]
];
for(var i = 0; i < imgURLs.length; i++) {
  var img = document.createElement("img");
  img.src = imgURLs[i][1];
  imgs[imgURLs[i][0]] = img;
}
function initImgLoader() {
  
}

//https://i.canthack.it/detecting-broken-images-js.html
function imgLoaded(img) {
  if(!img.complete) {
    return false;
  }
  if(typeof img.naturalWidth != "undefined" && img.naturalWidth == 0) {
    return false;
  }
  return true;
}

function image(url) {
  var img = document.createElement("img");
  img.src = url;
  return img;
}
