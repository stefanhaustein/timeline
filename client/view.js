var view = module.exports = exports = {};

var model = require('model');

view.toGrayscale = function(rgb) {
    return 0.21 * rgb[0] + 0.71 * rgb[1] + 0.07* rgb[2];
};

view.hsvToRgb = function(h, s, v) {
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


/**
 * The start time offset and zoom for the main view. Is able to translate
 * between event times and screen coordinates.
 * 
 * @constructor
 */
view.State = function(viewportHeight, border, range) {
    /** @type{number} */
    this.viewportHeight = viewportHeight;

    this.border = border;

    /** @type{number} */
    this.timeOffset = 0;
    
    /** @type{number} */
    this.scale = 1.0;    
    
    this.zoomTo(range);
};

/**
 * Return the y-coordinate for the given time value.
 * @param {number} t .
 * @return {number} .
 */
view.State.prototype.timeToY = function(t) {
    return (t - this.timeOffset) * this.scale + this.border;
};

/**
 * Return the time value for the given y-coordinate.
 * @param {number} y .
 * @return {number} .
 */
view.State.prototype.yToTime = function(y) {
    return (y - this.border) / this.scale + this.timeOffset;
};

view.State.prototype.zoomTo = function(timeSpan) {
    this.timeOffset = timeSpan.start;
    this.scale = (this.viewportHeight - 2 * this.border) / (timeSpan.end - timeSpan.start);
};

view.State.prototype.zoom = function(y, factor) {
    this.timeOffset = this.yToTime(y);
    this.scale *= factor;
    this.timeOffset += this.yToTime(this.border) - this.yToTime(y);
};

view.State.prototype.setViewportHeight = function(viewportHeight) {
    var oldHeight = this.viewportHeight;
    this.viewportHeight = viewportHeight;
    this.zoom(0, viewportHeight / oldHeight);
};


/**
 * The scale displayed on the left hand side.
 * 
 * @constructor
 * @param {Element} rootElement The root element to render the gutter in.
 */
view.Gutter = function(rootElement) {
    this.rootElement = rootElement;
    this.elements = {};
    this.epoch = 0;
    this.timer = null;
    this.dirty = false;
    this.mayAdd = 0;
};

/**
 * Update the gutter. Existing elements are updated immediately; new elements 
 * are added as needed using a timer. No elements are added in the immediate
 * call to avoid animation issues.
 * 
 * It may be feasible to speed this up further by adding an intermediate div 
 * that can be moved as a whole for scrolling without zooming. 
 * 
 * @param {!view.ViewState} viewState The view state.
 * @param {boolean} opt_add Whether new elements may be added in this call.
 */ 
view.Gutter.prototype.update = function(viewState, opt_add) {
    if (this.timer) {
        window.clearTimeout(this.timer);
        this.timer = null;
    }

    var viewportHeight = this.rootElement.offsetHeight;

    var idealStepCount = viewportHeight / 100;    
    var idealStep = viewportHeight / idealStepCount;
    var idealTimeStep = idealStep / viewState.scale;
        
    var digits = Math.round(Math.log(idealTimeStep) / Math.log(10));
    var timeStep = Math.max(Math.pow(10, digits), 1);
    var pixelStep = timeStep * viewState.scale;
    
    // start two steps up.
    var t = (Math.round(viewState.timeOffset / timeStep) - 2) * timeStep;
    this.epoch++;

    var subDivision;
    var halfDash = "–";
    if (pixelStep < 24) {
        timeStep *= 2;
        subDivision = 2;
        halfDash = "—";
    } else { 
        subDivision = pixelStep > 64 ? 4 : pixelStep > 32 ? 2 : 1; 
    }
    var subStep = 0;
    this.dirty = false;
    this.mayAdd = opt_add ? 2 : 0;
    
    var precision = 1/viewState.scale;

    while(true) {
        var key =  "" + t;
        var child = this.elements[key];
        if (!child) {
            this.dirty = true;
            if (this.mayAdd > 0) {
                child = document.createElement("div");
                child.className = 'timeStep';
                this.rootElement.appendChild(child);
                this.elements[key] = child;
                this.mayAdd--;
            }
        } else {
            child.classList.add('stable');
        }
        
        var y = Math.round(viewState.timeToY(t));
        if (child) {
            var label;
            switch(subStep * (4/subDivision) % 4) {
                case 0: 
                    label = model.timeToString(t, precision) + " —";
                    break;
                case 2:
                    label = halfDash;
                    break;
                default:
                    label = "-";
            }
            child.innerHTML = label;
            child.style.top = y - child.offsetHeight / 2;
            child.gutterEpoch = this.epoch;
        }
        if (y > viewportHeight) {
            break;
        }
        t += timeStep/subDivision;
        subStep++;
    }
    for (var key in this.elements) {
        var child = this.elements[key];
        var epoch = child.gutterEpoch;
        if (epoch && epoch != this.epoch) {
            this.rootElement.removeChild(child);
            delete this.elements[key];
        }
    }
    
    if (this.dirty) {
        var gutter = this;
        this.timer = window.setTimeout(function() {
            gutter.update(viewState, true);
        }, 10);
    }
};



/**
 * The main Event Tree.
 * 
 * @constructor
 * @param {!Element} rootElement
 */
view.EventTree = function(rootElement, rootEvent) {
    
    /** 
     * The root element the event tree is rendere into.
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
};

view.EventTree.LABEL_WIDTH = 150;
view.EventTree.ROT_LABEL_WIDTH = 24;

view.EventTree.prototype.measureDepth = function(event, viewState) {
    var h = this.rootElement.offsetHeight;
    var min = 1000;
    var smallCount = 0
    for (var i = 0; i < event.children.length; i++) {
        var child = event.children[i];
        var start = viewState.timeToY(child.start);
        var end = viewState.timeToY(child.end);
        if (end < -h/2 || start > 1.5 * h || start == end) continue;
        if (end - start < view.EventTree.LABEL_WIDTH) {
            smallCount++;
        }
        var d = this.measureDepth(child, viewState) + 1;
        if (d < min) {
            min = d;
        }
    }
    return smallCount < 2 ? min : 0;
};

view.EventTree.prototype.render = function(viewState, addElements) {
    var w = this.rootElement.offsetWidth;
    var h = this.rootElement.offsetHeight;
    var depth = this.measureDepth(this.rootEvent, viewState);
    if (this.timer) {
        clearTimeout(this.timer);
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


view.EventTree.prototype.renderLeaf = function(
        viewState, parentElement, parentY, event, hide, timeLimit, width, viewportHeight) {
    var y = viewState.timeToY(event.start);
    var top = y - parentY;

    var element = document.getElementById(event.id);
    if (hide || y > viewportHeight) {
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
        element.innerHTML = event.getHtml();
        parentElement.appendChild(element);
    } else {
        element.classList.add('stable');
    }

    element.style.top = top;
    element.style.width = width;
    if (!element.heightForWidth) {
        element.heightForWidth = [];
    }

    var height = element.heightForWidth[width];
    if (height == null) {
        element.style.display = 'block';
        height = element.offsetHeight;
        element.heightForWidth[width] = height;
    }
    if (y + height > viewState.timeToY(timeLimit)) {
        element.style.display = 'none';
        return 0;
    }
    if (element.style.display == 'none') {
        element.style.display = 'block';
        element.classList.remove('stable');
    }
    return height;
};


view.EventTree.prototype.renderNode = function(
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
        element = document.createElement("div");
        element.setAttribute('id', event.id);
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
        labelWidth = view.EventTree.ROT_LABEL_WIDTH;
        labelDiv.style.width = height;
        labelDiv.style.height = labelWidth;
        labelDiv.style.top = height;
    } else {
        labelDiv.className = "label";
        labelWidth = view.EventTree.LABEL_WIDTH;
        labelDiv.style.top = 0;
        labelDiv.style.width = labelWidth;
        labelDiv.style.height = height;
    }
    var containerWidth = width - labelWidth;
    labelDiv.style.display = labelWidth > 0 ? "block" : "none";
    containerDiv.style.left = labelWidth;
    containerDiv.style.width = containerWidth;

    if (containerWidth < view.EventTree.LABEL_WIDTH || height < 50 || 
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
    var childTimeLimit = event.start;
    for (var i = 0; i < count; i++) {
        var child = event.children[i];

        if (childTimeLimit <= child.start) {
            childTimeLimit = event.end;
            for (var j = i + 1; j < count; j++) {
                var childJ = event.children[j];
                if (childJ.start != childJ.end || 
                    (document.getElementById(childJ.id) &&
                     document.getElementById(childJ.id).style.display != 'none')) {
                    childTimeLimit = Math.min(childJ.start, childTimeLimit);
                    break;
                }
            }
        }

        var hide = filledToTime > child.start;

        if (child.start == child.end) {
            var height = this.renderLeaf(
                viewState, containerDiv, y, child, hide, childTimeLimit, containerWidth, viewportHeight);
            if (height != 0) {
                filledToTime = viewState.yToTime(viewState.timeToY(child.start) + height);
            } 
        } else {
            this.renderNode(
                viewState, containerDiv, y, child, collapse - 1, i / (count + 1),  containerWidth, viewportHeight);
            filledToTime = child.end;
        }
    }
};

