var eventtree = module.exports = exports = {};

var view = require('view');
var model = require('model');

/**
 * The main Event Tree.
 * 
 * @constructor
 * @param {!Element} rootElement
 */
eventtree.EventTree = function(rootElement, rootEvent) {
    
    /** 
     * The root element the event tree is rendered into.
     * @type {!Element} 
     */
    this.rootElement = rootElement;  
    
    /**
     * The root timeline event for this event tree.
     * @type {!model.Event}
     */
    this.rootEvent = rootEvent;
    
    /**
     * Timer id, used to continue updating if the update was incomplete.
     * @type {?number}
     */
    this.timer = null;
    
    /**
     * Flag to indicate that this component needs further updating.
     */
    this.dirty = false;
    
    /** 
     * Counts up z-indices while draing to make sure the fixed label
     * is hidden correctly. There must be way to get rid of this....
     */
    this.zIndex = 0;
    
    this.lastScale;
    this.savedScale;
};

eventtree.LABEL_WIDTH = 150;
eventtree.ROT_LABEL_WIDTH = 24;
eventtree.LINE_HEIGHT = 20;
eventtree.MIN_LINES = 2;

eventtree.EventTree.prototype.measureDepth = function(event, viewState) {
    var h = this.rootElement.offsetHeight;
    var min = 1000;
    var smallCount = 0
    for (var i = 0; i < event.children.length; i++) {
        var child = event.children[i];
        var start = viewState.timeToY(child.start);
        var end = viewState.timeToY(child.end);
        if (end < -h/2 || start > 1.5 * h || start == end) continue;
        if (end - start < eventtree.LABEL_WIDTH) {
            smallCount++;
        }
        var d = this.measureDepth(child, viewState) + 1;
        if (d < min) {
            min = d;
        }
    }
    return smallCount < 2 ? min : 0;
};

eventtree.EventTree.prototype.render = function(viewState, addElements) {
    var w = this.rootElement.offsetWidth;
    var h = this.rootElement.offsetHeight;
    var depth = this.measureDepth(this.rootEvent, viewState);
    if (this.timer) {
        clearTimeout(this.timer);
    }
        
    if (viewState.scale != this.savedScale) {
        this.lastScale = this.savedScale;
        this.savedScale = viewState.scale;
    }
        
    this.zIndex = 0;
    this.dirty = false;
    this.mayAdd = addElements ? 2 : 0;
    this.renderNode(
        viewState, this.rootElement, 0, this.rootEvent, depth, 0.5, w, h);

    if (this.dirty) {
        var eventTree = this;
        this.timer = window.setTimeout(function() {
            eventTree.render(viewState, true);
        }, 10);
    }
};


eventtree.EventTree.prototype.renderLeaf = function(
        viewState, parentElement, parentY, event, timeLimit, width, viewportHeight) {
    var y = viewState.timeToY(event.start);
    var top = y - parentY;

    var element = document.getElementById(event.id);
    if (y > viewportHeight) {
        if (element) {
            parentElement.removeChild(element);
        }
        return 0;
    }

    if (!element) {
        this.dirty = true;  // still need to change class to stable
        if (this.mayAdd-- <= 0) {
            return 0;
        }
        element = document.createElement("div");
        element.setAttribute('id', event.id);
        element.className = 'event leaf';
        element.eventTreeEvent = event;
        element.innerHTML = //'&macr;&nbsp;&nbsp;' + 
            event.getHtml();
        parentElement.appendChild(element);
        element.eventTreeEvent = event;
        
        if (event.images) {
            for (var i = 0; i < event.images.length; i++) {
                var image = event.images[i];
                var imageName = image[0];
                var cut = imageName.lastIndexOf('/');
                var requestSize = Math.round(eventtree.MIN_LINES * eventtree.LINE_HEIGHT * image[1]);
                var link = wiki.getUrl('File:' + imageName.substr(cut + 1));

                var imageElement = document.createElement("img");
                element.insertBefore(imageElement, element.firstChild);
                imageElement.className = 'eventImage';
                imageElement.src = "http://upload.wikimedia.org/wikipedia/commons/thumb/" + 
                    imageName + "/"+requestSize +"px-" + imageName.substr(cut + 1);
                window.console.log("requesting image: " + imageElement.src);
            }
        }
    } else {
        element.classList.add('stable');
    }

    element.style.top = top;
    element.style.width = width;
    var height = Math.floor((viewState.timeToY(timeLimit) - y) / eventtree.LINE_HEIGHT) * eventtree.LINE_HEIGHT;
    element.style.maxHeight = height + "px";

    if (height < element.scrollHeight) {
        element.classList.add('overflow');
    } else {
        element.classList.remove('overflow');
    }
};


eventtree.EventTree.prototype.renderNode = function(
        viewState, parentElement, parentY, event, collapse, fraction, width, viewportHeight) {
    var y = viewState.timeToY(event.start);
    var height = (event.end - event.start) * viewState.scale;
    var element = document.getElementById(event.id);
    if (y + height < -viewportHeight/2 ||
            y > viewportHeight * 1.5) {
        if (element) {
            parentElement.removeChild(element);
        }
        return;
    }

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

    var labelDiv;
    var containerDiv; 
    if (!element) {
        this.dirty = true;
        if (this.mayAdd-- <= 0) {
            return;
        }
        element = document.createElement("a");
        element.setAttribute('id', event.id);
        element.setAttribute('href', '#' + model.intervalToString(event));
        element.className = 'event node';
        element.eventTreeEvent = event;
        labelDiv = document.createElement("div");
        labelDiv.className = 'text';
        labelDiv.innerHTML = event.getHtml();
        parentElement.appendChild(element);
        element.appendChild(labelDiv);
        containerDiv = document.createElement("div");
        containerDiv.className = 'container';
        element.appendChild(containerDiv);
        var rgb = event.color;
        if (!rgb) {
            if (event.parent && event.parent.color) {
                var prgb = event.parent.color;
                var f = fraction * 0.7 + 0.7;
                rgb = [prgb[0]*f, prgb[1]*f, prgb[2]*f];
            } else {
                rgb = view.hsvToRgb(200.0 * fraction, 0.5, 1);
                event.color = rgb;
            }
        }
        element.style.backgroundColor = 
            'rgb(' + Math.floor(rgb[0])+ "," + Math.floor(rgb[1]) + "," + Math.floor(rgb[2])+')';
        element.style.borderColor = element.style.color = 
            (rgb && view.toGrayscale(rgb) < 48) ? "#ccc" : "#333";
    } else {
        labelDiv = element.firstChild;
        containerDiv = labelDiv.nextSibling;
        element.classList.add('stable');
        labelDiv.classList.add('stable');
        containerDiv.classList.add('stable');
    }

    if (y < 0) {
        labelDiv.style.position = 'fixed';
    } else {
        labelDiv.style.position = 'relative';
    }

    element.style.top = top;
    element.style.width = width;
    element.style.height = height;
    element.style.zIndex = this.zIndex++;

    var labelWidth;
    if (event === this.rootEvent) {
        labelWidth = 0;
    } else if (collapse >= 0) {
        labelDiv.className = "label rot";
        labelWidth = eventtree.ROT_LABEL_WIDTH;
        labelDiv.style.width = height;
        labelDiv.style.height = labelWidth;
        labelDiv.style.top = height;
    } else {
        labelDiv.className = "label";
        labelWidth = eventtree.LABEL_WIDTH;
        labelDiv.style.top = 0;
        labelDiv.style.width = labelWidth;
        labelDiv.style.height = height;
    }
    var containerWidth = width - labelWidth;
    labelDiv.style.display = labelWidth > 0 ? "block" : "none";
    containerDiv.style.left = labelWidth;
    containerDiv.style.width = containerWidth;

    if (containerWidth < eventtree.LABEL_WIDTH || height < 50 || 
            y + height/2 < -viewportHeight || y > 1.5 * viewportHeight) {
        containerDiv.innerHTML = "";
        return height;
    }
    
    if (event.needsFetch) {
        console.log("Fetching Wikipedia data for " + event.description);
        var self = this;
        event.fetchData(function(){
            self.render(viewState);
        });
    }
    
    var filledToTime = event.start; 
    
    // "Time" height of a line on the screen 
    var timeHeight = eventtree.MIN_LINES * eventtree.LINE_HEIGHT / viewState.scale;
    
    var zoomIn = viewState.scale > this.lastScale;

    for (var i = 0; i < count; i++) {
        var child = event.children[i];

        if (child.start == child.end) {
            var childTimeLimit = event.end;
            var hide = child.start < filledToTime || 
                child.start + timeHeight > childTimeLimit;
            var childElement = document.getElementById(child.id);
            if (!hide) {
                for (var j = i + 1; j < count; j++) {
                    var childJ = event.children[j];
                    if (childJ.start > child.start + timeHeight) {
                        childTimeLimit = childJ.start;
                        break;
                    }
                    if (childJ.start != childJ.end) {
                        hide = true;
                        break;
                    }
                    if (!childElement && document.getElementById(childJ.id)) {
                        hide = true;
                        break;
                    }
                }
            }
            
            if (hide) {
                if (childElement) {
                    containerDiv.removeChild(childElement);
                }
            } else {
                this.renderLeaf(
                    viewState, containerDiv, y, child, childTimeLimit, containerWidth, viewportHeight);
                filledToTime = child.start + timeHeight;
            }
        } else {
            this.renderNode(
                viewState, containerDiv, y, child, collapse - 1, i / (count + 1),  containerWidth, viewportHeight);
            filledToTime = child.end;
        }
    }
};
