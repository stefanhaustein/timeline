var view = module.exports = exports = {};


view.BORDER = 8;

/**
 * @constructor
 */
view.State = function(viewportHeight, range) {
    /** @type{number} */
    this.viewportHeight = viewportHeight;

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
    return (t - this.timeOffset) * this.scale + view.BORDER;
};

/**
 * Return the time value for the given y-coordinate.
 * @param {number} y .
 * @return {number} .
 */
view.State.prototype.yToTime = function(y) {
    return (y - view.BORDER) / this.scale + this.timeOffset;
};

view.State.prototype.zoomTo = function(timeSpan) {
    this.timeOffset = timeSpan.start;
    this.scale = (this.viewportHeight - 2 * view.BORDER) / (timeSpan.end - timeSpan.start);
};


view.State.prototype.zoom = function(y, factor) {
    this.timeOffset = this.yToTime(y);
    this.scale *= factor;
    this.timeOffset += this.yToTime(view.BORDER) - this.yToTime(y);
};


view.State.prototype.setViewportHeight = function(viewportHeight) {
    var oldHeight = this.viewportHeight;
    this.viewportHeight = viewportHeight;
    this.zoom(0, viewportHeight / oldHeight);
};
