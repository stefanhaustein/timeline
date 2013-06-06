var timeline = require('timeline');
var string = require('string');
var time = require('time');
var data = require('data');
var quirks = require('quirks');
var gutter = new view.Gutter(document.getElementById('gutter'));
var view = require('view');

var timelineElement = document.getElementById('timeline');
var wikiFrame = document.getElementById('wikiFrame');

var LABEL_WIDTH = 150;
var ROT_LABEL_WIDTH = 24;
var ZOOM_FACTOR = 1.1;

var showZoom = false;

var timePointer = document.getElementById("timepointer");
var earthImage = document.getElementById('earthImage');

var rootEvent = new timeline.Event(
    data.TIMELINES[0], data.TIMELINES[1], 
    data.TIMELINES[2], data.TIMELINES[3], data.TIMELINES[4]);

var viewState = new view.State(timelineElement.offsetHeight, rootEvent);

var lastMouseY = timelineElement.offsetHeight / 2;


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
        var start = viewState.timeToY(child.start);
        var end = viewState.timeToY(child.end);
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
    var y = viewState.timeToY(event.start);
    var height = (event.end - event.start) * viewState.scale;
    
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
            element.style.backgroundColor = 
                'rgb(' + Math.floor(rgb[0])+ "," + Math.floor(rgb[1]) + "," + Math.floor(rgb[2])+')';
            element.style.borderColor = element.style.color = 
                (rgb && toGrayscale(rgb) < 48) ? "#ccc" : "#333";
        } 
    } else {
        element.classList.add('animated');
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
        if (viewState.timeToY(event.start) + height > viewState.timeToY(timeLimit)) {
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

        var childOverlap = filledTo > viewState.timeToY(child.start);

        var childHeight = render(
            containerDiv, y, event.children[i], childOverlap, childTimeLimit, 
            collapse - 1, i / (count + 1),  remainingWidth, viewportHeight);
        if (!childOverlap && childHeight != 0) {
            filledTo = viewState.timeToY(child.start) + childHeight;
        }
    }
    return height;
}


function fixBounds() {
    var minScale = (viewState.viewportHeight-2*view.BORDER) / (rootEvent.end - rootEvent.start);
    if (viewState.scale < minScale) {
        viewState.scale = minScale;
    }
    if (viewState.timeOffset < rootEvent.start) {
        viewState.timeOffset = rootEvent.start;
    }
    if (viewState.yToTime(viewState.viewportHeight-view.BORDER) > rootEvent.end) {
        viewState.timeOffset -= viewState.yToTime(viewState.viewportHeight-view.BORDER) - rootEvent.end;
    }
}

var resetTimer;

function update(smooth) {
    if (resetTimer) {
        window.clearTimeout(resetTimer);
    }
    if (viewState.scale < (viewState.viewportHeight - 2*view.BORDER) / (rootEvent.end - rootEvent.start)) {
        resetTimer = window.setTimeout(function() {
            fixBounds();
            resetTimer = null;
            update(true);
        }, 100);
    } else {
        fixBounds();
    }
    
    gutter.element.className = timelineElement.className = smooth ? "smooth" : "";

    var w = timelineElement.offsetWidth;
    var h = timelineElement.offsetHeight;
    timelineElement.style.height = h + "px";
    
    gutter.update(viewState);
    
    updateTimePointer();
    
    render(timelineElement, 0, rootEvent, false, 0, measureDepth(rootEvent), 0.5, w, h);
}

function updateTimePointer() {
    timePointer.style.top = lastMouseY - timePointer.offsetHeight / 2;
    var t = viewState.yToTime(lastMouseY);
    
    timePointer.innerHTML = (showZoom ? 
        '|<span id="reset">&nbsp;&times;&nbsp;</span>' + 
        '|<span id="zoomOut">&nbsp;&minus;&nbsp;</span>' + 
        '|<span id="zoomIn">&nbsp;&plus;&nbsp;</span>|' : time.toString(t)) + " —";
    
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
    earthImage.src="http://upload.wikimedia.org/wikipedia/commons/thumb/" + 
        imgName + "/" + width + "px-" + imgName.substr(cut + 1);
    earthImage.setAttribute('href', '#File:' + imgName.substr(cut + 1));
}

// Event handlers 


//timelineElement.addEventListener('DOMMouseScroll', onMouseWheel, false);  
timelineElement.addEventListener("mousewheel", onMouseWheel, false);
gutter.element.addEventListener("mousewheel", onMouseWheel, false);

document.getElementById("meta").onclick = 
gutter.element.onclick = function(event) {
    var element = event.target;
    if (element) {
        switch(element.id) {
            case 'wikipediaTab':
                showWikipedia('');
                break;
            case 'contextTab':
                showWikipedia(null);
                break;
            case 'zoomIn':
                viewState.zoom(event.clientY, 1.3);
                update(true);
                event.preventDefault();
                break;
            case 'zoomOut':
                viewState.zoom(event.clientY, 1/1.3);
                update(true);
                event.preventDefault();
                break;
            case 'reset':
                viewState.zoomTo(rootEvent);
                viewState.zoom(viewState.viewportHeight/2, 1/1.1);
                update(true);
                event.preventDefault();
        }
    }
}


function showWikipedia(title) {
    wikiFrame.style.display = title != null ? "block" : "none";
    document.getElementById("context").style.display = title != null ? "none" : "block";
    
    if (title != null) {
        document.getElementById("wikipediaTab").classList.add("active");
        document.getElementById("contextTab").classList.remove("active");
        if (title) {
            wikiFrame.src = "http://en.m.wikipedia.org/wiki/"+ title;  
        }
    } else {
        document.getElementById("wikipediaTab").classList.remove("active");
        document.getElementById("contextTab").classList.add("active");
    }
}



timelineElement.onclick = function(event) {
    var element = event.target;
    while (element) {
        var href = element.getAttribute("href");
        var e = element['_event_'];
        if (href) {
            var cut = href.lastIndexOf('/');
            showWikipedia(href.substr(cut + 1));
            event.preventDefault();
            break;
        } else if (e) {
            while (e.end == e.start) {
                e = e.parent;
            }
            viewState.zoomTo(e);
            update(true);
            event.preventDefault();
            break;
        }
        element = element.parentElement;
    }
};


function move(y, delta) {
    console.log("bottom time: " + viewState.yToTime(timelineElement.offsetHeight));
    if (delta < 0 && viewState.timeOffset <= rootEvent.start) {
        viewState.zoom(view.BORDER, 1.1);
    } else if (delta > 0 && viewState.yToTime(viewState.viewportHeight - view.BORDER) >= rootEvent.end) {
        viewState.zoom(viewState.viewportHeight - view.BORDER, 1.1);
    } else {
        viewState.timeOffset += delta / viewState.scale;
    }
}


window.onresize = function(e) {
    console.log(e);
    timelineElement.style.height = window.innerHeight;
    viewState.setViewportHeight(window.innerHeight);
    update();
};



function onMouseWheel(e) {
    var delta = quirks.getNormalizedWheelDeltaY(event);
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
            viewState.zoom(event.clientY, ZOOM_FACTOR);
        } else if (delta > 0) {
            viewState.zoom(event.clientY, 1/ZOOM_FACTOR);
        }
    } else {
        move(event.clientY, delta);
    }
    e.preventDefault();
    update();
}

document.onmousemove = function(event) {
    lastMouseY = event.clientY;
    showZoom = event.clientX < gutter.element.offsetWidth;
    updateTimePointer();
};


document.onkeydown = function(event) {
    console.log(event);
    var char = event.which == null ? event.keyCode : event.which;
    var y = timelineElement.offsetHeight / 2;
    if (char === 187) {
        viewState.zoom(y, ZOOM_FACTOR);
    } else if (char === 189) {
        viewState.zoom(y, 1/ZOOM_FACTOR);
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



