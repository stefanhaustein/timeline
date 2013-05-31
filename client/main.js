var timeline = require('timeline');
var time = require('time');
var wiki = require('wiki');

var timelineElement = document.getElementById('timeline');
var wikiFrame = document.getElementById('wikiFrame');

var LABEL_WIDTH = 150;
var ROT_LABEL_WIDTH = 30;

var minOffset = -13700000000;
var timeOffset = minOffset;
var minScale = timelineElement.offsetHeight / -minOffset;
var timeScale = minScale;
var timePointer = document.getElementById("timepointer");

function timeToY(t) {
    return (t - timeOffset) * timeScale;
}

function yToTime(y) {
    return y / timeScale + timeOffset;
}

function toGrayscale(rgb) {
    return 0.21 * rgb[0] + 0.71 * rgb[1] + 0.07* rgb[2];
}

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

function measureDepth(event) {
    var h = timelineElement.offsetHeight;
    var min = 1000;
    for (var i = 0; i < event.children.length; i++) {
        var child = event.children[i];
        var start = timeToY(child.start);
        var end = timeToY(child.end);
        if (end < -h/2 || start > 1.5 * h || start == end) continue;
        if (end - start < h / 3) {
            return 0;
        }
        var d = measureDepth(child) + 1;
        if (d < min) {
            min = d;
        }
    }
    return min;
}

function render(parentElement, parentY, event, nextStart, collapse, fraction, remainingWidth, remainingHeight) {
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
        element['_event_'] = event;
        textDiv = document.createElement("div");
        textDiv.className = 'text';
        textDiv.innerHTML = event.description;
        parentElement.appendChild(element);
        element.appendChild(textDiv);
        if (count) {
            containerDiv = document.createElement("div");
            element.appendChild(containerDiv);
        }
        if (event.start < event.end && event.color) {
            var rgb = event.color;
            element.style.backgroundColor = 
                "rgb(" +rgb[0]+ "," + rgb[1] + "," + rgb[2]+")";
            element.style.color = toGrayscale(rgb) < 48 ? "#ccc" : "#333";
        } 
    } else {
        textDiv = element.firstChild;
        if (count !== 0) {
            containerDiv = textDiv.nextSibling;
        }
    }
    
    // TODO(haustein) Avoid this here
    
    element.style.top = top;
    element.style.height = height;
    element.style.width = remainingWidth;
   
    if (count) {
        if (false && event.description == "natural history") {
            textDiv.style.display = "none";
            containerDiv.setAttribute("style",
                "position:absolute;top:0;left:0;height:"+height+";width:"+ remainingWidth + "px");
        } else {
            var lw;
            if (collapse >= 0) {
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
        } 
    } 

    textDiv.style.display = height >= 20 ? "block": "none";

    if (remainingWidth < LABEL_WIDTH || height < 8 || 
        y + height < -timelineElement.offsetHeight || 
        y > 2 * timelineElement.offsetHeight) {
        if (containerDiv) {
            containerDiv.innerHTML = "";
        }
        return;
    }
    
    for (var i = 0; i < event.children.length; i++) {
        var child = event.children[i];
        var cf = ((child.start + child.end) / 2 - event.start) / (event.end - event.start);
        var childNextStart = i < count - 1 ? event.children[i+1].start : event.end;
        render(containerDiv, y, event.children[i], childNextStart, collapse - 1, cf, remainingWidth, remainingHeight);
    }
}


function update(y, smooth) {
    timelineElement.className = smooth ? "smooth" : "";

    if (timeScale < minScale) {
        timeScale = minScale;
    }
    if (timeOffset < minOffset) {
        timeOffset = minOffset;
    }
    var tbottom = yToTime(timelineElement.offsetHeight);
    if (tbottom > 0) {
        timeOffset -= tbottom;
    }

    var w = timelineElement.offsetWidth;
    var h = timelineElement.offsetHeight;
    timelineElement.style.height = h + "px";
    
    updateTimePointer(y);
    
    render(timelineElement, 0, naturalHistory, 0, measureDepth(naturalHistory), 0.5, w, h);
}


// Event handlers 


timelineElement.addEventListener('DOMMouseScroll', onMouseWheel, false);  
timelineElement.addEventListener("mousewheel", onMouseWheel, false);

timelineElement.onclick = function(event) {
    var element = event.target;
    if (element) { 
        var href = element.getAttribute("href");
        //wiki.fetchHtml(href.substr(1), function(s) {
        //    console.log(s);
        //    wikiFrame.innerHTML = s;
        //});
        if (href) {
            wikiFrame.src = "http://en.m.wikipedia.org/wiki/"+ href.substr(1);  
            event.preventDefault();
        } else {
            var e = null;
            do {
                e = element['_event_'];
                element = element.parentElement;
            } while(e == null && element != null);
            if (e) {
                timeOffset = e.start;
                timeScale = timelineElement.offsetHeight / (e.end - e.start);
                update(event.clientY, true);
                event.preventDefault();
            }
        }
    }
};

function updateTimePointer(y) {
    timePointer.style.top = y - timePointer.offsetHeight / 2;
    timePointer.innerHTML = time.toString(yToTime(y)) + " &rarr;";
}

window.onresize = function(e) {
    console.log(e);
    timelineElement.style.height = window.innerHeight;
    minScale = window.innerHeight / -minOffset;
        update(0);
};

function onMouseWheel(event) {
    var factor = 1.1;
    var delta = event.wheelDeltaY;
    var y = event.clientY;
    if (event.shiftKey) {
        if (delta < 0) {
            // middle between y and  middle to zoom out
            y = (y + (timelineElement.offsetHeight / 2)) / 2;
            timeOffset = yToTime(y);
            timeScale /= factor;
            timeOffset += yToTime(0) - yToTime(y);
        } else {
            // move y beyond to simplify zooming into corners
            y = y + (y - timelineElement.offsetHeight / 2) * 0.2;
            timeOffset = yToTime(y);
            timeScale *= factor;
            timeOffset += yToTime(0) - yToTime(y);
        }
        event.preventDefault();
        update(event.clientY);
    } else {
        var oldOffset = timeOffset;
        if (delta < 0) {
            timeOffset += 10 / timeScale;
        } else {
            timeOffset -= 10 / timeScale;
        }
        update(event.clientY);
        if (timeOffset !== oldOffset) {
            event.preventDefault();
        }
    }
}

document.onmousemove = function(event) {
    updateTimePointer(event.clientY);
};


document.onkeydown = function(event) {
    console.log(event);
    var char = event.which == null ? event.keyCode : event.which;
    var y = timelineElement.offsetHeight / 2;
    if (char === 187) {
        timeOffset = yToTime(y);
        timeScale *= 3.0/2.0;
        timeOffset += yToTime(0) - yToTime(y);
    } else if (char === 189) {
        timeOffset = yToTime(y);
        timeScale *= 2.0/3.0;
        timeOffset += yToTime(0) - yToTime(y);
    } else if (char === 38) {
        timeOffset -= 10 / timeScale;
    } else if (char === 40) {
        timeOffset += 10 / timeScale;
    } else {
        return;
    }
    update(event.clientY);
};


// startup

var naturalHistory = new timeline.Event("13,700 Ma - 0", "natural history");

wiki.fetchWikiText("Timeline of natural history", function(text) {
    console.log("Wiki fetch result:");
    naturalHistory.parse(text);
    update(0);
});

/*    
var req = new XMLHttpRequest();
req.onload = function() {
    naturalHistory.parse(this.responseText);
    update(0);
};
req.open('get', 'wikipedia_natural_history.txt');
req.send();
*/

