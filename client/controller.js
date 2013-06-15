// Imports

var model = require('model');
var data = require('data');
var quirks = require('quirks');
var wiki = require('wiki');
var view = require('view');
var eventtree = require('eventtree');

// Constants

var ZOOM_FACTOR = 1.1;
var BORDER = 16;
var MAX_SCALE = 500;

var rootEvent = new model.Event(
    data.TIMELINES[0], data.TIMELINES[1], 
    data.TIMELINES[2], data.TIMELINES[3], data.TIMELINES[4]);

var eventTree = new eventtree.EventTree(document.getElementById('eventTree'), rootEvent);
var gutter = new view.Gutter(document.getElementById('gutter'));
var viewState = new view.State(eventTree.rootElement.offsetHeight, BORDER, rootEvent);

var timePointer = document.getElementById("timepointer");

var lastMouseY = eventTree.rootElement.offsetHeight / 2;


function fixBounds() {
    var minScale = (viewState.viewportHeight - 2 * BORDER) / 
                        (rootEvent.end - rootEvent.start);
    if (viewState.scale < minScale) {
        viewState.scale = minScale;
    } else if (viewState.scale > MAX_SCALE) {
        viewState.scale = MAX_SCALE;
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
                            (rootEvent.end - rootEvent.start) ||
        viewState.scale > MAX_SCALE) {
        resetTimer = window.setTimeout(function() {
            fixBounds();
            resetTimer = null;
            update(true);
        }, 100);
    } else {
        fixBounds();
    }

    if (smooth) {
        gutter.rootElement.classList.add('smooth');
        eventTree.rootElement.classList.add('smooth');
    } else {
        gutter.rootElement.classList.remove('smooth');
        eventTree.rootElement.classList.remove('smooth');
    }

    var w = eventTree.rootElement.offsetWidth;
    var h = eventTree.rootElement.offsetHeight;
    eventTree.rootElement.style.height = h + "px";
    
    gutter.update(viewState);
    updateTimePointer();
    eventTree.render(viewState);
}


// use binary search in both cases below!
function updateTable(time) {
    var timeString = model.timeToString(time, 1/viewState.scale);
    document.getElementById("timepointerTime").innerHTML = timeString + ' &mdash;';
    var timeUnit = '';
    if (/Ma$/.test(timeString)) {
        timeUnit = 'Ma';
        timeString = timeString.substr(0, timeString.length - 3);
    }
    
    document.getElementById("tableTime").innerHTML = timeString;
    document.getElementById("timeUnit").innerHTML = timeUnit;

    var timePercent = 100 - 100 * (time-rootEvent.start) / (rootEvent.end - rootEvent.start);
    if (timePercent < 0) {
        timePercent = 0;
    } else if (timePercent > 100) {
        timePercent = 100;
    }
    timePercent = timePercent.toPrecision(3);
    document.getElementById("timePercent").innerHTML = timePercent;


    var index = -1;
    var count = data.ENVIRONMENT.length;
    while (index + 1 < count && data.ENVIRONMENT[index + 1][0] <= time) {
        index++;
    }
    var startData = index == -1 ? [NaN, NaN, NaN, NaN, NaN] : data.ENVIRONMENT[index];
    var endData = index + 1 == count ? startData : data.ENVIRONMENT[index + 1];
    
    // interpolate.
    var fraction = index + 1 == count ? 0.5 : (time - startData[0]) / (endData[0] - startData[0]);
    var interpolated = [];
    for (var i = 0; i < startData.length; i++) {
        interpolated[i] = startData[i] * (1-fraction) + endData[i] * fraction;
    }

    document.getElementById("o2").innerHTML = interpolated[1].toFixed(1);
    document.getElementById("co2").innerHTML = interpolated[2].toFixed(1);
    document.getElementById("temperature").innerHTML = interpolated[3].toFixed(1);
    document.getElementById("seaLevel").innerHTML = interpolated[4].toFixed(1);
}


var globeIndex = -1;
function updateGlobe(time) {
    var index = 0;
    var count = data.GLOBES.length;
    while (index + 1 < count && data.GLOBES[index + 1][0] <= time) {
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
    
    // Make this dynamically depending on the RHS size.
    var requestSize;
    if (scale == 0.5) {
        requestSize = 160;
    } else if (scale != 1) {
        requestSize = 640;
    } else {
        requestSize = 320;
    }

    var cut = imageName.lastIndexOf('/');
    var link = wiki.getUrl('File:' + imageName.substr(cut + 1));

    var imageUrl = "http://upload.wikimedia.org/wikipedia/commons/thumb/" + 
        imageName + "/"+requestSize +"px-" + imageName.substr(cut + 1);

    var globeElement = document.getElementById("globe");
    var globeLabelElement = document.getElementById("globeLabel");

    globeElement.style.backgroundColor = backgroundColor;
    globeElement.style.backgroundImage = "url('" + imageUrl + "')";
    var size =  Math.floor(scale * 320);
    globeElement.style.backgroundSize = size + "px";
    globeElement.style.backgroundPosition = 
        Math.floor((globeElement.offsetWidth - size) / 2 + 320 * offset) + "px 50%";

    globeElement.href = link;
    globeLabelElement.innerHTML = 
        imageLabel + ' ' + model.timeToString(imageTime);
    globeLabelElement.href = link;

}


function updateTimePointer() {
    timePointer.style.top = lastMouseY - timePointer.offsetHeight / 2;
    var time = viewState.yToTime(lastMouseY);
    
    updateTable(time);
    updateGlobe(time);
}


function gotoHash() {
    var hash = window.location.hash;
    var timespan = {start: rootEvent.start, end: rootEvent.end};
    if (hash && hash.length > 2) {
        hash = decodeURIComponent(hash.substr(1));
        model.parseInterval(hash, timespan);
    }
    if (timespan.end <= timespan.start) {
        timespan = rootEven;
    }
    viewState.zoomTo(timespan);
    update(true);
}

// Event handlers 

window.onhashchange = gotoHash;


//timelineElement.addEventListener('DOMMouseScroll', onMouseWheel, false);  
eventTree.rootElement.addEventListener("mousewheel", onMouseWheel, false);
gutter.rootElement.addEventListener("mousewheel", onMouseWheel, false);

document.body.onclick = function(event) {
    var element = event.target;
    if (!element) return;

    var href = element.getAttribute("href");
    if (href && /wikipedia\.org\/wiki\//.test(href) && href.indexOf("File:") == -1) {
        var cut = href.lastIndexOf('/');
        showWikipedia(href.substr(cut + 1));
        event.preventDefault();
        return;
    }

    var done = true;
    switch(element.id) {
        case 'metaTab':
            showTab('meta');
            break;
        case 'wikipediaTab':
            showTab('wikipedia');
            break;
        case 'contextTab':
            showTab('context');
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
            if (window.location.hash && window.location.hash.length > 1) {
                window.location.hash = "";
            } else {
                viewState.zoomTo(rootEvent);
                viewState.zoom(viewState.viewportHeight/2, 1/1.1);
                update(true);
            }
            break;
        default:
            done = false;
    }
    if (done) {
        event.preventDefault(); 
        return;
    }

}


function showTab(name) {
    document.getElementById("contextTab").classList.remove("active");
    document.getElementById("metaTab").classList.remove("active");
    document.getElementById("wikipediaTab").classList.remove("active");

    document.getElementById("contextCard").style.display = 'none';
    document.getElementById("metaCard").style.display = 'none';
    document.getElementById("wikipediaCard").style.display = 'none';

    document.getElementById(name + "Tab").classList.add('active');
    document.getElementById(name + "Card").style.display = 'block';
    
    if (name == 'context') {
        globeIndex = -1;
        updateTimePointer();
    }
}


function showWikipedia(title) {
    showTab('wikipedia');
    document.getElementById('wikipediaCard').src = "http://en.m.wikipedia.org/wiki/"+ title;  
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
        move(event.clientY, -delta);
    }
    e.preventDefault();
    update();
}


document.getElementById('timeline').onmousemove = function(event) {
    lastMouseY = event.clientY;
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
        move(y, -10);
    } else if (char === 40) {
        move(y, 10);
    } else {
        return;
    }
    update(event.clientY);
};

gotoHash();