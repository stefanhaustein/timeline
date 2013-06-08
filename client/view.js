var view = module.exports = exports = {};

var model = require('model');

view.toGrayscale = function(rgb) {
    return 0.21 * rgb[0] + 0.71 * rgb[1] + 0.07* rgb[2];
}

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


view.Gutter = function(element) {
    this.element = element;   
    this.elements = {};
    this.epoch = 0;
    this.timer = null;
};


/**
 * Update the gutter. Existing elements are updated immediately; new elements 
 * are added as needed using a timer. No elements are added in the immediate
 * call to avoid animation issues.
 * 
 * We could speed this up further by adding an intermediate div that we
 * can move as a whole if we scroll without zooming. 
 * 
 * @param {!view.ViewState} viewState The view state.
 * @param {boolean} opt_add Whether new elements may be added in this call.
 */ 
view.Gutter.prototype.update = function(viewState, opt_add) {
    if (this.timer) {
        window.clearTimeout(this.timer);
        this.timer = null;
    }
    
    var viewportHeight = this.element.offsetHeight;

    var idealStepCount = viewportHeight / 100;    
    var idealStep = viewportHeight / idealStepCount;
    var idealTimeStep = idealStep / viewState.scale;
        
    var digits = Math.round(Math.log(idealTimeStep) / Math.log(10));
    var timeStep = Math.max(Math.pow(10, digits), 1);
    var pixelStep = timeStep * viewState.scale;
    
    // start two steps up.
    var t = (Math.round(viewState.timeOffset / timeStep) - 2) * timeStep;
    var test1 = model.parseTime(model.timeToString(t));
    var test2 = model.parseTime(model.timeToString(t + timeStep));
    var useKey = Math.abs(test1 - t) > timeStep / 10 || 
        Math.abs(test2 - (t + timeStep)) > timeStep;
    
    this.epoch++;

    var subDivision;
    var halfDash = "–";
    if (pixelStep < 24) {
        timeStep *= 2;
        subDivision = 2;
        halfDash = "—";re
    } else { 
        subDivision = pixelStep > 64 ? 4 : pixelStep > 32 ? 2 : 1; 
    }
    var subStep = 0;
    var complete = true;
    var added = 0;
    
    while(true) {
        var key =  "" + t;
        var child = this.elements[key];
        if (!child) {
            if (!opt_add || added > 2) {
                complete = false;
            } else {
                var child = document.createElement("div");
                child.className = 'timeStep';
                this.element.appendChild(child);
                this.elements[key] = child;
                added++;
            }
        } else {
            child.classList.add('animated');
        }
        
        var y = Math.round(viewState.timeToY(t));
        if (child) {
            var label;
            switch(subStep * (4/subDivision) % 4) {
                case 0: 
                    label = (useKey ? key : model.timeToString(t)) + " —";
                    break;
                case 2:
                    label = halfDash;
                    break;
                default:
                    label = "-";
            }
            child.innerHTML = label;
            child.style.top = y - child.offsetHeight / 2;
            child['_epoch_'] = this.epoch;
        }
        if (y > viewportHeight) {
            break;
        }
        t += timeStep/subDivision;
        subStep++;
    }
    for (var key in this.elements) {
        var child = this.elements[key];
        var epoch = child['_epoch_'];
        if (epoch && epoch != this.epoch) {
            this.element.removeChild(child);
            delete this.elements[key];
        }
    }
    
    if (!complete) {
        var gutter = this;
        this.timer = window.setTimeout(function() {
            gutter.update(viewState, true);
        }, 20);
    }
    return complete;
};


/**
 * @constructor
 * 
 * @param {!Element} rootElement
 */
view.EventTree = function(rootElement, rootEvent) {
    
    /** @type {!Element} */
    this.rootElement = rootElement;  
    
    /** @type {!model.Event} */
    this.rootEvent = rootEvent;
};

view.EventTree.LABEL_WIDTH = 150;
view.EventTree.ROT_LABEL_WIDTH = 24;

view.EventTree.prototype.measureDepth = function(event, viewState) {
    var h = this.rootElement.offsetHeight;
    var min = 1000;
    for (var i = 0; i < event.children.length; i++) {
        var child = event.children[i];
        var start = viewState.timeToY(child.start);
        var end = viewState.timeToY(child.end);
        if (end < -h/2 || start > 1.5 * h || start == end) continue;
        if (end - start < view.EventTree.LABEL_WIDTH) {
            return 0;
        }
        var d = this.measureDepth(child, viewState) + 1;
        if (d < min) {
            min = d;
        }
    }
    return min;
}

view.EventTree.prototype.render = function(viewState) {
    var w = this.rootElement.offsetWidth;
    var h = this.rootElement.offsetHeight;
    var depth = this.measureDepth(this.rootEvent, viewState);
    
    window.console.log("render; w: " + w + " H: " +h);
    
    this.renderEvent(
        viewState, this.rootElement, 0, this.rootEvent, depth, 0.5, w, h);
};


view.EventTree.prototype.renderLeaf = function(
        viewState, parentElement, parentY, event, overlap, timeLimit, width) {
    var y = viewState.timeToY(event.start);
    var top = y - parentY;

    var element = document.getElementById(event.id);
    if (overlap) {
        if (element) {
            parentElement.removeChild(element);
        }
        return 0;
    }

    if (!element) {
        element = document.createElement("div");
        element.setAttribute('id', event.id);
        element.className = 'leaf';
        element['_event_'] = event;
        element.innerHTML = event.getHtml();
        parentElement.appendChild(element);
    } else {
        element.classList.add('animated');
    }

    element.style.top = top;
    element.style.width = width;
    element.style.display = "block";

    var height = element.offsetHeight;
    if (viewState.timeToY(event.start) + height > viewState.timeToY(timeLimit)) {
        element.style.display = "none";
        return 0;
    }

    return height;
};


view.EventTree.prototype.renderEvent = function(
        viewState, parentElement, parentY, event, collapse, fraction, width, viewportHeight) {
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
    
    var top = y - parentY;
    var count = event.children.length;

    var element = document.getElementById(event.id);
    var textTop = y < 0 ? -y : 0;

    var labelDiv;
    var containerDiv; 
    if (!element) {
        element = document.createElement("div");
        element.setAttribute('id', event.id);
        element.className = event.start == event.end ? 'event' : 'span';
        element['_event_'] = event;
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
        element.classList.add('animated');
        labelDiv = element.firstChild;
        containerDiv = labelDiv.nextSibling;
    }
    
    element.style.top = top;
    element.style.width = width;
    element.style.height = height;
   
    var labelWidth;
    if (event === this.rootEvent) {
        labelWidth = 0;
    } else if (collapse >= 0) {
        labelDiv.className = "label rot";
        labelWidth = view.EventTree.ROT_LABEL_WIDTH;
        labelDiv.style.width = height;
        labelDiv.style.height = labelWidth;
        labelDiv.style.top = textTop + height;
    } else {
        labelDiv.className = "label";
        labelWidth = view.EventTree.LABEL_WIDTH;
        labelDiv.style.top = textTop;
        labelDiv.style.width = labelWidth;
        labelDiv.style.height = height;
    }
    var containerWidth = width - labelWidth;
    labelDiv.style.display = labelWidth > 0 ? "block" : "none";
    containerDiv.style.left = labelWidth;
    containerDiv.style.width = containerWidth;

    if (containerWidth < view.EventTree.LABEL_WIDTH || height < 50 || 
            y + height/2 < -viewportHeight || y > 1.5 * viewportHeight) {
        if (containerDiv) {
            containerDiv.innerHTML = "";
        }
        return height;
    }
    
    if (event.needsFetch) {
        console.log("Fetching Wikipedia data for " + event.description);
        var self = this;
        event.fetchData(function(){
            self.render(viewState);    
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

        var childHeight;
        
        if (child.start == child.end) {
            childHeight = this.renderLeaf(
                viewState, containerDiv, y, child, childOverlap, childTimeLimit, containerWidth);
        } else {
            childHeight = this.renderEvent(
                viewState, containerDiv, y, child, collapse - 1, i / (count + 1),  containerWidth, viewportHeight);
        }
        if (!childOverlap && childHeight != 0) {
            filledTo = viewState.timeToY(child.start) + childHeight;
        }
    }
    return height;
};

