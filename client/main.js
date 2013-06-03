var timeline = require('timeline');
var string = require('string');
var time = require('time');
var data = require('data');
var quirks = require('quirks');
var gutterPackage = require('gutter');
var gutterElement = document.getElementById('gutter');
var gutter = new gutterPackage.Gutter(gutterElement);

var timelineElement = document.getElementById('timeline');
var wikiFrame = document.getElementById('wikiFrame');

var LABEL_WIDTH = 150;
var ROT_LABEL_WIDTH = 24;
var ZOOM_FACTOR = 1.1;

var showZoom = false;

// TODO: Derive from root.
var minOffset = -13700000000;
var timeOffset = minOffset;
var minScale = timelineElement.offsetHeight / (-minOffset + 2013);
var timeScale = minScale;
var timePointer = document.getElementById("timepointer");

var earthImage = document.getElementById('earthImage');

var naturalHistory = new timeline.Event(
    data.TIMELINES[0], data.TIMELINES[1], data.TIMELINES[2], data.TIMELINES[3], data.TIMELINES[4]);
var lastMouseY = timelineElement.offsetHeight / 2;

gutterElement['_event_'] = naturalHistory;


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
    return [~~r,~~g,~~b];
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

function render(parentElement, parentY, event, overlap, timeLimit, collapse, fraction, remainingWidth, viewportHeight) {
    var y = (event.start - timeOffset) * timeScale;
    var height = (event.end - event.start) * timeScale;
    
    if (y < -2 * viewportHeight) {
        var rm = -(y + 2 * viewportHeight);
        y += rm;
        height -= rm;
    }
    if (height > 4 * viewportHeight) {
        height = 4 * viewportHeight;
    } 
    
    var textOnly = event.start == event.end;
    var top = y - parentY;
    var count = event.children.length;

    var element = document.getElementById(event.id);
    var textTop = y < 0 ? -y : 0;

    var textDiv;
    var containerDiv = null; 
    if (!element) {
        if (textOnly && overlap) return 0;
        element = document.createElement("div");
        element.setAttribute('id', event.id);
        element.className = event.start == event.end ? 'event' : 'span';
        element['_event_'] = event;
        textDiv = document.createElement("div");
        textDiv.className = 'text';
        textDiv.innerHTML = event.getHtml();
        parentElement.appendChild(element);
        element.appendChild(textDiv);
        if (count || event.needsFetch || event.fetchChildren) {
            containerDiv = document.createElement("div");
            element.appendChild(containerDiv);
        }
        if (event.start < event.end) {
            var rgb = event.color;
            if (!rgb) {
                if (event.parent && event.parent.color) {
                    var prgb = event.parent.color;
                    var f = fraction * 0.7 + 0.7;
                    rgb = [prgb[0]*f, prgb[1]*f, prgb[2]*f];
                } else {
                    rgb = hsvToRgb(200.0 * fraction, 0.5, 1);
                    event.color = rgb;
                }
            }
            element.style.backgroundColor = 'rgb(' + Math.floor(rgb[0])+ "," + Math.floor(rgb[1]) + "," + Math.floor(rgb[2])+')';
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
    
    if (textOnly) {
        if (overlap) {
            parentElement.removeChild(element);
            return 0;
        }
        element.style.display = "block";
        height = textDiv.offsetHeight;
        if (timeToY(event.start) + height > timeToY(timeLimit)) {
            element.style.display = "none";
            return 0;
        } 
    } else {
        element.style.height = height;
        textDiv.style.display = height >= 20 ? "block": "none";
    }


    if (remainingWidth < LABEL_WIDTH || height < 50 || 
            y + height/2 < -viewportHeight || y > 1.5 * viewportHeight) {
        if (containerDiv) {
            containerDiv.innerHTML = "";
        }
        return height;
    }
    
    if (event.needsFetch) {
        console.log("Fetching Wikipedia data for " + event.description);
        event.fetchData(function(){
            update();    
        });
    }
    
    var filledTo = 0;
    var childTimeLimit = event.start;
    for (var i = 0; i < count; i++) {
        var child = event.children[i];

        if (childTimeLimit <= child.start) {
            childTimeLimit = event.end;
            for (var j = i + 1; j < count; j++) {
                var childJ = event.children[j];
                if (childJ.start != childJ.end) {
                    childTimeLimit = Math.min(childJ.start, childTimeLimit);
                    break;
                }
            }
        }

        var childOverlap = filledTo > timeToY(child.start);

        var childHeight = render(containerDiv, y, event.children[i], childOverlap, childTimeLimit, collapse - 1, i / (count + 1), remainingWidth, viewportHeight);
        if (!childOverlap && childHeight != 0) {
            filledTo = timeToY(child.start) + childHeight;
        }
    }
    return height;
}


function update(smooth) {
    timelineElement.className = smooth ? "smooth" : "";

    if (timeScale < minScale) {
        timeScale = minScale;
    }
    if (timeOffset < minOffset) {
        timeOffset = minOffset;
    }
    var tbottom = yToTime(timelineElement.offsetHeight);
    if (tbottom > 2013) {
        timeOffset -= tbottom-2013;
    }

    var w = timelineElement.offsetWidth;
    var h = timelineElement.offsetHeight;
    timelineElement.style.height = h + "px";
    
    gutter.update(timeOffset, timeScale);
    
    updateTimePointer();
    
    render(timelineElement, 0, naturalHistory, false, 0, measureDepth(naturalHistory), 0.5, w, h);
}

function updateTimePointer() {
    timePointer.style.top = lastMouseY - timePointer.offsetHeight / 2;
    var t = yToTime(lastMouseY);
    
    timePointer.innerHTML = (showZoom ? "|<a href='#reset'>&nbsp;&times;&nbsp;</a>|<a href='#zoomOut'>&nbsp;&minus;&nbsp;</a>|<a href='#zoomIn'>&nbsp;&plus;&nbsp;</a>|" : time.toString(t)) + " —";
    
    // use binary search!
    var index = 0;
    while (index+1 < data.GLOBES.length && data.GLOBES[index+1][0] < t) {
        index++;
    }
    var globe = data.GLOBES[index];
    var imgName = globe[1];

    document.getElementById("imageContainer").style.backgroundColor = globe[2] ? "black" : "white";

    var width = 420;
    if (globe[3]){
        width *= globe[3];
    }
    var cut = imgName.lastIndexOf('/');
//    earthImage.width = "" + Math.floor(width);
    earthImage.src="http://upload.wikimedia.org/wikipedia/commons/thumb/" + imgName + "/" + width + "px-" + imgName.substr(cut + 1);
    earthImage.setAttribute('href', '#File:' + imgName.substr(cut + 1));
}

// Event handlers 


//timelineElement.addEventListener('DOMMouseScroll', onMouseWheel, false);  
timelineElement.addEventListener("mousewheel", onMouseWheel, false);
gutterElement.addEventListener("mousewheel", onMouseWheel, false);


function zoomTo(e) {
    timeOffset = e.start;
    timeScale = timelineElement.offsetHeight / (e.end - e.start);
}

gutterElement.onclick = function(event) {
    var element = event.target;
    lastMouseY = event.clientY;

    if (element) {
        console.log(event);
        var href = element.getAttribute('href')
        if (href=='#zoomIn') {
            zoom(event.clientY, 1.3);
            update(true);
        } else if (href=='#zoomOut') {
            zoom(event.clientY, 1/1.3);
            update(true);
        } else if (href=='#reset') {
            zoomTo(naturalHistory);
            update(true);
        }
    }
}


timelineElement.onclick = function(event) {
    var element = event.target;
    
    lastMouseY = event.clientY;
    while (element) {
        
        
        var href = element.getAttribute("href");
        var e = element['_event_'];
        if (href) {
            wikiFrame.style.display = "block";
            document.getElementById("meta").style.display = "none";
            wikiFrame.src = "http://en.m.wikipedia.org/wiki/"+ href.substr(1);  
            event.preventDefault();
            break;
        } else if (e) {
            while (e.end == e.start) {
                e = e.parent;
            }
            zoomTo(e);
            update(true);
            wikiFrame.style.display = "none";
            document.getElementById("meta").style.display = "block";
            event.preventDefault();
            break;
        }
        element = element.parentElement;
    }
};


function zoom(y, factor) {
    timeOffset = yToTime(y);
    timeScale *= factor;
    timeOffset += yToTime(0) - yToTime(y);
}


function move(y, delta) {
    console.log("bottom time: " + yToTime(timelineElement.offsetHeight));
    if (delta < 0 && timeOffset <= minOffset) {
        zoom(0, 1.1);
    } else if (delta > 0 && yToTime(timelineElement.offsetHeight + 1) > 2013) {
        zoom(timelineElement.offsetHeight, 1.1);
    } else {
        timeOffset += delta / timeScale;
    }
}


window.onresize = function(e) {
    console.log(e);
    lastMouseY = e.clientY;
    timelineElement.style.height = window.innerHeight;
    minScale = window.innerHeight / -minOffset;
    update();
};



function onMouseWheel(e) {
    var delta = quirks.getNormalizedWheelDeltaY(event);
    lastMouseY = e.clientY;
    // shift -> zoom
    if (e.ctrlKey || e.altKey) {
        return;
    }
    
    if (e.shiftKey) {
        // Auto-axis swap in chrome...
        if (delta == 0) {
            delta = e.wheelDeltaX;
        }
        if (delta < 0) {
            zoom(lastMouseY, ZOOM_FACTOR);
        } else if (delta > 0) {
            zoom(lastMouseY, 1/ZOOM_FACTOR);
        }
    } else {
        move(lastMouseY, delta);
    }
    e.preventDefault();
    update();
}

document.onmousemove = function(event) {
    lastMouseY = event.clientY;
    showZoom = event.clientX < gutterElement.offsetWidth;
    updateTimePointer();
};


document.onkeydown = function(event) {
    console.log(event);
    var char = event.which == null ? event.keyCode : event.which;
    var y = timelineElement.offsetHeight / 2;
    if (char === 187) {
        zoom(y, ZOOM_FACTOR);
    } else if (char === 189) {
        zoom(y, 1/ZOOM_FACTOR);
    } else if (char === 38) {
        move(y, 10);
    } else if (char === 40) {
        move(y, -10);
    } else {
        return;
    }
    update(event.clientY);
};


update();

// startup







/*    
var req = new XMLHttpRequest();
req.onload = function() {
    naturalHistory.parse(this.responseText);
    update(0);
};
req.open('get', 'wikipedia_natural_history.txt');
req.send();
*/

