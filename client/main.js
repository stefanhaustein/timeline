var timeline = require('timeline');
var time = require('time');

var rootElement = document.getElementById('timeline');
var wikiFrame = document.getElementById('wiki');

var LABEL_WIDTH = 150;
var ROT_LABEL_WIDTH = 30;


function hsvToRgb(h, s, v) {
    var hi = ~~(h/60.0);
    var f = h/60.0 - hi;
    v *= 255.0;
    var p = v*(1 - s);
    var q = v*(1 - s*f);
    var t = v*(1 - s*(1 - f));
    var r,g,b;
    switch(hi){
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default:
            r = v; g = t; b = p;
    }
    return "rgb(" + ~~r + "," + ~~g + "," + ~~b + ")";
}

function render(parentElement, parentY, event, nextStart, big, fraction, remainingWidth, remainingHeight) {
    var y = (event.start - timeOffset) * timeScale;
    var height = ((event.start == event.end ? nextStart : event.end) - event.start) * timeScale;
    var top = y - parentY;
    var count = event.children.length;

    var element = document.getElementById(event.id);
    var textTop = y < 0 ? -y : 0; 

    var textDiv;
    var containerDiv = null; 
    if (!element) {
        element = document.createElement("div");
        element.setAttribute('id', event.id);
        element.className = event.start == event.end ? 'event' : 'span';
        textDiv = document.createElement("div");
        textDiv.className = 'text';
        textDiv.innerHTML = event.description;
        parentElement.appendChild(element);
        element.appendChild(textDiv);
        if (count) {
            containerDiv = document.createElement("div");
            element.appendChild(containerDiv);
        }
    } else {
        textDiv = element.firstChild;
        if (count !== 0) {
            containerDiv = textDiv.nextSibling;
        }
    }

    element.style.height = height;
    element.style.top = top;
    element.style.width = remainingWidth;
    
    if (event.start < event.end) {
        var rgb = hsvToRgb(360-fraction * 360, 0.3, 1);
         element.style.backgroundColor = rgb;
    }
        
    if (count) {
        var allBig = big;
        if (allBig) {
            var anyBig = false;
            for(var i = 0; i < event.children.length; i++) {
                var child = event.children[i];
                var bigChild = (child.end - child.start) * timeScale > remainingHeight / 4;
                anyBig |= bigChild;
                if (child.start != child.end && timeToY(child.start) > -remainingHeight/2 && timeToY(child.end) < remainingHeight * 1.5 && 
                    !bigChild) {
                     allBig = false;
                    break;
                }
            }
            allBig &= anyBig;
        }
        if (event.description == "natural history") {
            textDiv.style.display = "none";
            containerDiv.setAttribute("style",
                "position:absolute;top:0;left:0;height:"+height+";width:"+ remainingWidth + "px");
            big = allBig;
        } else {
            var lw;
            if (big) {
                textDiv.className = "rot";
                lw = ROT_LABEL_WIDTH;
                textDiv.style.width = height;
                textDiv.style.height = lw;
                textDiv.style.top = textTop + height;
            } else {
                textDiv.className = "text";
                lw = LABEL_WIDTH;
                textDiv.style.top = textTop;
                textDiv.style.width = lw;
                textDiv.style.height = height;
            }
            remainingWidth -= lw;
            textDiv.style.display = "block";
            containerDiv.setAttribute("style",
                "position:absolute;left:"+lw+"px;top:0;height:"+height+";width:"+ remainingWidth + "px");
            big = allBig;
        } 
    } 

    if (remainingWidth < LABEL_WIDTH || height <= 20) {
        if (containerDiv) {
            containerDiv.innerHTML = "";
        }
        return;
    }
    
    for (var i = 0; i < event.children.length; i++) {
        var child = event.children[i];
        var cf = ((child.start + child.end) / 2 - event.start) / (event.end - event.start);
        var childNextStart = i < count - 1 ? event.children[i+1].start : event.end;
        render(containerDiv, y, event.children[i], childNextStart, big, cf, remainingWidth, remainingHeight);
    }
}

var minOffset = -13700000000;
var timeOffset = minOffset;
var minScale = window.innerHeight / -minOffset;
var timeScale = minScale;
var timePointer = document.getElementById("timepointer");

rootElement.addEventListener('DOMMouseScroll', onMouseWheel, false);  
rootElement.addEventListener("mousewheel", onMouseWheel, false);
rootElement.onclick = function(event) {
    console.log(event);
    if (event.target) { 
        var href = event.target.getAttribute("href");
        wikiFrame.src = "http://en.m.wikipedia.org/wiki/"+ href.substr(1);   
    }
    event.preventDefault();
};

function timeToY(t) {
    return (t - timeOffset) * timeScale;
}

function yToTime(y) {
    return y / timeScale + timeOffset;
}

function updateTimePointer(y) {
    timePointer.style.top = y - timePointer.offsetHeight / 2;
    timePointer.innerHTML = time.toString(yToTime(y)) + " &rarr;";
}

window.onresize = function(e) {
    console.log(e);
     minScale = window.innerHeight / -minOffset;
        update(0);
};

function onMouseWheel(event) {
    var factor = 1.1;
    var delta = event.wheelDeltaY;
    var y = event.clientY;
    if (!event.shiftKey) {
        if (delta < 0) {
            // middle between y and  middle to zoom out
            y = (y + (rootElement.offsetHeight / 2)) / 2;
            timeOffset = yToTime(y);
            timeScale /= factor;
            timeOffset += yToTime(0) - yToTime(y);
        } else {
            // move y beyond to simplify zooming into corners
            y = y + (y - rootElement.offsetHeight / 2) * 0.05;
            timeOffset = yToTime(y);
            timeScale *= factor;
            timeOffset += yToTime(0) - yToTime(y);
        }
    } else {
        if (delta < 0) {
            timeOffset -= 5 / timeScale;
        } else {
            timeOffset += 5 / timeScale;
        }
    }
    event.preventDefault();
    update(event.clientY);
}

document.onmousemove = function(event) {
    updateTimePointer(event.clientY);
};



document.onkeydown = function(event) {
    console.log(event);
    var char = event.which == null ? event.keyCode : event.which;
    if (char === 187) {
        timeScale *= 3.0/2.0;
    } else if (char === 189) {
        timeScale *= 2.0/3.0;
        if (timeScale < minScale/2) {
            timeScale = minScale/2;
        }
    } else if (char === 38) {
        timeOffset -= 5 / timeScale;
    } else if (char === 40) {
        timeOffset += 5 / timeScale;
    } else {
        return;
    }
    window.console.log("new scale: "+ timeScale);
    update(event.clientY);
};

function update(y) {
    if (timeScale < minScale) {
        timeScale = minScale;
    }
    if (timeOffset < minOffset) {
        timeOffset = minOffset;
    }
    var tbottom = yToTime(rootElement.offsetHeight);
    if (tbottom > 0) {
        timeOffset -= tbottom;
    }

    
    var w = rootElement.offsetWidth;
    var h = window.innerHeight;
    rootElement.style.height = h + "px";
    
    updateTimePointer(y);
    
    render(rootElement, 0, naturalHistory, 0, true, 0.5, w, h);
}
    
var naturalHistory = new timeline.Event("13,700 Ma - 0", "natural history");
var req = new XMLHttpRequest();
req.onload = function() {
    naturalHistory.parse(this.responseText);
    update(0);
};
req.open('get', 'wikipedia_natural_history.txt');
req.send();
