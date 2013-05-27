var timeline = module.exports = exports = {};

console.log(timeline);

var time = require("time");

console.log(time);


timeline.foo = "bar";

/**
 * @constructor
 * @param {string} timespan The unparsed time span of the event
 * @param {description} The description of the event
 */
timeline.Event = function(timespan, description) {
    /** @type {number} */
    this.start = NaN;
    
    /** @type {number} */
    this.end = NaN;
    
    /** @type {string} */
    this.description = description;
 
    /** @type {array.<timeline.Event>} */
    this.children = [];
 
    time.parseInterval(timespan, this);
};
    
    
/**
 * @param {timeline.Event} event
 */
timeline.Event.prototype.add = function(event) {
    console.log("adding " + event + " to " + this);
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child.start < event.start && child.end > event.end) {
            child.add(event);
            return;
        }
    }
    this.children.push(event);
};

timeline.Event.prototype.toString = function() {
    return time.toString(this.start) + ' - ' + time.toString(this.end) + ': ' +
        this.description;
}

/**
 * @param {string} text
 */
timeline.Event.prototype.parse = function(text) {
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var cut = line.indexOf(':');
        if (cut == -1) {
            window.console.log('":" expected in line: "' + line + '"');
        } else {
            this.add(new timeline.Event(line.substr(0, cut), line.substr(cut + 1)));
        }
    }
};

console.log(timeline);

