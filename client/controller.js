var model = require('model');
var string = require('string');
var data = require('data');
var quirks = require('quirks');
var wiki = require('wiki');
var gutter = new view.Gutter(document.getElementById('gutter'));
var view = require('view');

var wikiFrame = document.getElementById('wikiFrame');

var ZOOM_FACTOR = 1.1;
var BORDER = 10;

var showZoom = false;

var timePointer = document.getElementById("timepointer");

var rootEvent = new model.Event(
    data.TIMELINES[0], data.TIMELINES[1], 
    data.TIMELINES[2], data.TIMELINES[3], data.TIMELINES[4]);

var eventTree = new view.EventTree(document.getElementById('eventTree'), rootEvent);

var viewState = new view.State(eventTree.rootElement.offsetHeight, BORDER, rootEvent);

var lastMouseY = eventTree.rootElement.offsetHeight / 2;



function fixBounds() {
    var minScale = (viewState.viewportHeight - 2 * BORDER) / 
                        (rootEvent.end - rootEvent.start);
    if (viewState.scale < minScale) {
        viewState.scale = minScale;
    }
    if (viewState.timeOffset < rootEvent.start) {
        viewState.timeOffset = rootEvent.start;
    }
    if (viewState.yToTime(viewState.viewportHeight - BORDER) > rootEvent.end) {
        viewState.timeOffset -= 
            viewState.yToTime(viewState.viewportHeight - BORDER) - rootEvent.end;
    }
}

var resetTimer;

function update(smooth) {
    if (resetTimer) {
        window.clearTimeout(resetTimer);
    }
    if (viewState.scale < (viewState.viewportHeight - 2 * BORDER) / 
                            (rootEvent.end - rootEvent.start)) {
        resetTimer = window.setTimeout(function() {
            fixBounds();
            resetTimer = null;
            update(true);
        }, 100);
    } else {
        fixBounds();
    }
    
    gutter.element.className = eventTree.rootElement.className = smooth ? "smooth" : "";

    var w = eventTree.rootElement.offsetWidth;
    var h = eventTree.rootElement.offsetHeight;
    eventTree.rootElement.style.height = h + "px";
    
    gutter.update(viewState);
    
    updateTimePointer();
    
    eventTree.render(viewState);
}

var globeIndex = -1;

function updateTimePointer() {
    timePointer.style.top = lastMouseY - timePointer.offsetHeight / 2;
    var time = viewState.yToTime(lastMouseY);
    
    timePointer.innerHTML = (showZoom ? 
        '|<span id="reset">&nbsp;&times;&nbsp;</span>' + 
        '|<span id="zoomOut">&nbsp;&minus;&nbsp;</span>' + 
        '|<span id="zoomIn">&nbsp;&plus;&nbsp;</span>|' : model.timeToString(time)) + " —";
    
    // use binary search!
    var index = 0;
    var count = data.GLOBES.length;
    while (index + 1 < count && data.GLOBES[index + 1][0] < time) {
        index++;
    }
    
    if (globeIndex == index) {
        return;
    }
    globeIndex = index;
    
    var globeData = data.GLOBES[index];
    var imageTime = globeData[0];
    var imageLabel = globeData[1];
    var imageName = globeData[2];
    var scale = globeData[3] ? globeData[3] : 1;
    var offset = globeData[4] ? globeData[4] : 0;
    var backgroundColor = globeData[5] ? globeData[5] : "#fff";

    var cut = imageName.lastIndexOf('/');
    var link = wiki.getUrl('File:' + imageName.substr(cut + 1));

    var imageUrl = "http://upload.wikimedia.org/wikipedia/commons/thumb/" + 
        imageName + "/320px-" + imageName.substr(cut + 1);

    var globeElement = document.getElementById("globe");
    var globeLabelElement = document.getElementById("globeLabel");

    globeElement.style.backgroundColor = backgroundColor;
    globeElement.style.backgroundImage = "url('" + imageUrl + "')";
    var size =  Math.floor(scale * 320)
    globeElement.style.backgroundSize = size + "px";
    globeElement.style.backgroundPosition = Math.floor((globeElement.offsetWidth - size) / 2 + 320 * offset) + "px 50%";
    

    globeElement.href = link;
    globeLabelElement.innerHTML = 
        imageLabel + ' ' + model.timeToString(imageTime);
    globeLabelElement.href = link;
}

// Event handlers 


//timelineElement.addEventListener('DOMMouseScroll', onMouseWheel, false);  
eventTree.rootElement.addEventListener("mousewheel", onMouseWheel, false);
gutter.element.addEventListener("mousewheel", onMouseWheel, false);

document.body.onclick = function(event) {
    var element = event.target;
    if (!element) {
        return;
    }
    var done = true;
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
            break;
        case 'zoomOut':
            viewState.zoom(event.clientY, 1/1.3);
            update(true);
            break;
        case 'reset':
            viewState.zoomTo(rootEvent);
            viewState.zoom(viewState.viewportHeight/2, 1/1.1);
            update(true);
        default:
            done = false;
    }
    if (done) {
        event.preventDefault(); 
        return;
    }
    while (element) {
        var href = element.getAttribute("href");
        var e = element['_event_'];
        if (href) {
            if (/wikipedia\.org\/wiki\//.test(href)) {
                var cut = href.lastIndexOf('/');
                showWikipedia(href.substr(cut + 1));
            } else {
                window.location = href;
            }
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


function move(y, delta) {
    if (delta < 0 && viewState.timeOffset <= rootEvent.start ) {
        viewState.zoom(BORDER, 1.1);
    } else if (delta > 0 && viewState.yToTime(viewState.viewportHeight - BORDER + 1) >= rootEvent.end) {
        viewState.zoom(viewState.viewportHeight - BORDER, 1.1);
    } else {
        viewState.timeOffset += delta / viewState.scale;
    }
}


window.onresize = function(e) {
    eventTree.rootElement.style.height = window.innerHeight;
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
    var y = eventTree.rootElement.offsetHeight / 2;
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



