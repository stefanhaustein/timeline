var view = module.exports = exports = {};


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
    
};


view.Gutter.prototype.update = function(viewState) {
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
        halfDash = "—";
    } else { 
        subDivision = pixelStep > 64 ? 4 : pixelStep > 32 ? 2 : 1; 
    }
    var subStep = 0;
    
    while(true) {
        var key =  "" + t;
        var child = this.elements[key];
        if (!child) {
            var child = document.createElement("div");
            child.className = 'timeStep';
            this.element.appendChild(child);
            this.elements[key] = child;
        } else {
            child.classList.add('animated');
        }
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
        var y = Math.round(viewState.timeToY(t));
        
        child.style.top = y - child.offsetHeight / 2;
        child['_epoch_'] = this.epoch;
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
};


