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
    var halfDash = "&ndash;";
    if (pixelStep < 24) {
        timeStep *= 2;
        subDivision = 2;
        halfDash = "&mdash;";
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
                    label = model.timeToString(t, precision) + " &mdash;";
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



