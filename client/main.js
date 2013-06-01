var timeline = require('timeline');
var string = require('string');
var time = require('time');
var wiki = require('wiki');
var quirks = require('quirks');
var gutterPackage = require('gutter');
var gutterElement = document.getElementById('gutter');
var gutter = new gutterPackage.Gutter(gutterElement);

var timelineElement = document.getElementById('timeline');
var wikiFrame = document.getElementById('wikiFrame');

var LABEL_WIDTH = 150;
var ROT_LABEL_WIDTH = 24;

var minOffset = -13700000000;
var timeOffset = minOffset;
var minScale = timelineElement.offsetHeight / -minOffset;
var timeScale = minScale;
var timePointer = document.getElementById("timepointer");

var earthImage = document.getElementById('earthImage');

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

function render(parentElement, parentY, event, nextStart, collapse, fraction, remainingWidth, viewportHeight) {
    var y = (event.start - timeOffset) * timeScale;
    var height = ((event.start == event.end ? nextStart : event.end) - event.start) * timeScale;
    
    if (y < -2 * viewportHeight) {
        var rm = -(y + 2 * viewportHeight);
        y += rm;
        height -= rm;
    }
    if (height > 4 * viewportHeight) {
        height = 4 * viewportHeight;
    } 
    
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
        if (event.start < event.end) {
            var rgb = event.color;
            if (!rgb && event.parent && event.parent.color) {
                var prgb = event.parent.color;
                var f = fraction + 0.5;
                rgb = [prgb[0]*f, prgb[1]*f, prgb[2]*f];
                window.console.log(rgb);
            }
            element.style.backgroundColor = rgb ? 
                'rgb(' + Math.floor(rgb[0])+ "," + Math.floor(rgb[1]) + "," + Math.floor(rgb[2])+')' : 
                hsvToRgb(360.0 * fraction, 0.5, 0.5);
            element.style.borderColor = element.style.color = (rgb && toGrayscale(rgb) < 48) ? "#ccc" : "#333";
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
        if (event.description == "Timeline of natural history") {
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
            y + height < -viewportHeight || y > 2 * viewportHeight) {
        if (containerDiv) {
            containerDiv.innerHTML = "";
        }
        return;
    }
    
    for (var i = 0; i < event.children.length; i++) {
        var child = event.children[i];
        var cf = ((child.start + child.end) / 2 - event.start) / (event.end - event.start);
        var childNextStart = i < count - 1 ? event.children[i+1].start : event.end;
        render(containerDiv, y, event.children[i], childNextStart, collapse - 1, cf, remainingWidth, viewportHeight);
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
    if (tbottom > 2013) {
        timeOffset -= tbottom;
    }

    var w = timelineElement.offsetWidth;
    var h = timelineElement.offsetHeight;
    timelineElement.style.height = h + "px";
    
    gutter.update(timeOffset, timeScale);
    
    updateTimePointer(y);
    
    render(timelineElement, 0, naturalHistory, 0, measureDepth(naturalHistory), 0.5, w, h);
}


function updateTimePointer(y) {
    timePointer.style.top = y - timePointer.offsetHeight / 2;
    var t = yToTime(y);
    timePointer.innerHTML = time.toString(t) + " –";
    
    // use binary search!
    var index = 0;
    while (index+1 < wiki.GLOBES.length && wiki.GLOBES[index+1][0] < t) {
        index++;
    }
    var imgName = wiki.GLOBES[index][1];
    var cut = imgName.lastIndexOf('/');
    earthImage.src = "http://upload.wikimedia.org/wikipedia/commons/thumb/" + imgName + "/200px-" + imgName.substr(cut + 1);
    earthImage.setAttribute('href', '#File:' + imgName.substr(cut + 1));
}

// Event handlers 


//timelineElement.addEventListener('DOMMouseScroll', onMouseWheel, false);  
timelineElement.addEventListener("mousewheel", onMouseWheel, false);
gutterElement.addEventListener("mousewheel", onMouseWheel, false);

gutterElement.onclick = timelineElement.onclick = function(event) {
    var element = event.target;
    while (element) {
        var href = element.getAttribute("href");
        var e = element['_event_'];
        if (href) {
            wikiFrame.src = "http://en.m.wikipedia.org/wiki/"+ href.substr(1);  
            event.preventDefault();
            break;
        } else if (e) {
            while (e.end == e.start) {
                e = e.parent;
            }
            timeOffset = e.start;
            timeScale = timelineElement.offsetHeight / (e.end - e.start);
            update(event.clientY, true);
            event.preventDefault();
            break;
        }
        element = element.parentElement;
    }
};



window.onresize = function(e) {
    console.log(e);
    timelineElement.style.height = window.innerHeight;
    minScale = window.innerHeight / -minOffset;
        update(0);
};

function onMouseWheel(e) {
    var factor = 1.1;
    var delta = quirks.getNormalizedWheelDeltaY(event);
    var y = e.clientY;
    if (e.shiftKey) {
        // Auto-axis swap in chrome...
        if (delta == 0) {
            delta = e.wheelDeltaX;
        }
        if (delta < 0) {
            // middle between y and  middle to zoom out
            y = (y + (timelineElement.offsetHeight / 2)) / 2;
            timeOffset = yToTime(y);
            timeScale /= factor;
            timeOffset += yToTime(0) - yToTime(y);
        } else if (delta > 0) {
            // move y beyond to simplify zooming into corners
            y = y + (y - timelineElement.offsetHeight / 2) * 0.2;
            timeOffset = yToTime(y);
            timeScale *= factor;
            timeOffset += yToTime(0) - yToTime(y);
        }
        e.preventDefault();
        update(e.clientY);
    } else {
        var oldOffset = timeOffset;
        timeOffset += delta / timeScale;
        update(e.clientY);
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



function fetchWiki(root, index) {
    console.log("fetchWiki " + index);
    if (index >= wiki.TIMELINES.length) {
        console.log("fetchWiki end reached")
        return null;
    }
    var line = wiki.TIMELINES[index];
    console.log("fetchWiki " + line);
    var cut = line.indexOf(':');
    var span = line.substr(0, cut);
    var title = string.trim(line.substr(cut + 1));
    var event = new timeline.Event(span, title);
    wiki.fetchWikiText(title, function(text) {
        console.log("Wiki fetch result:");
        event.parse(text);
        if (root) {
            root.insert(event);
        } else {
            root = event;
        }
        update(0);
        console.log("fetchWiki recursion");
        fetchWiki(root, index + 1);
    });
    return event;
}

var naturalHistory = fetchWiki(null, 0);
gutterElement['_event_'] = naturalHistory;


/*    
var req = new XMLHttpRequest();
req.onload = function() {
    naturalHistory.parse(this.responseText);
    update(0);
};
req.open('get', 'wikipedia_natural_history.txt');
req.send();
*/

