var timeline = module.exports = exports = {};
var time = require("time");
var string = require("string");

/** 
 * @type {number}
 */
timeline.nextId = 0;

timeline.parseWiki=function(s) {
    while(true) {
        var cut0 = s.indexOf("[[");
        if (cut0 == -1) break;
        var cut1 = s.indexOf("]]");
        if (cut1 == -1) break;
        var ww = s.substring(cut0 + 2, cut1);
        var cut2 = ww.indexOf('|');
        var link, label
        if (cut2 == -1) {
            link = label = ww;
        } else {
            link = ww.substr(0, cut2);
            label = ww.substr(cut2+1);
        }
        
        s = s.substr(0, cut0) + '<a href="#' + link + '">' + label + "</a>" + s.substring(cut1 + 2);
        console.log(s);
    }
    return s;
};

/**
 * @constructor
 * @param {string} timespan The unparsed time span of the event
 * @param {description} The description of the event
 */
timeline.Event = function(timespan, description) {
    /** @type {number} */
    this.start = 1e100;
    
    /** @type {number} */
    this.end = -1e100;
    
    /** @type {string} */
    this.description = timeline.parseWiki(description);
 
    /** @type {array.<timeline.Event>} */
    this.children = [];
 
    /** @type {number} */
    this.id = "evt" + (timeline.nextId++);
  
    if (timespan) {
        time.parseInterval(timespan, this);
    }
};
    
    
/**
 * @param {timeline.Event} event
 */
timeline.Event.prototype.add = function(event) {
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child.start < event.start && child.end > event.end) {
            child.add(event);
            return;
        }
    }
    this.children.push(event);
};

timeline.Event.prototype.expand = function() {
    var changed = false;
    for (var i = this.children.length - 1; i >= 0; i--) {
        var child = this.children[i];
        child.expand();
        if (child.start > child.end) {
            this.children.splice(i, 1);
            continue;
        } 
        
        var end = i + 1 < this.children.length ? this.children[i+1].start : this.end;
        var adjust = child;
        while(adjust.start != adjust.end) {
            adjust.end = end;
            if (adjust.children.length === 0) {
                break;
            }
            adjust = adjust.children[adjust.children.length - 1];
        }
        
        if (child.start < this.start) {
            this.start = child.start;
            changed = true;
        }
        if (child.end > this.end) {
            this.end = child.end;
            changed = true;
        }
    }
    
    
    
    if (changed) {
        console.log("expanded: "+ this.toString());
    }
}


timeline.Event.prototype.toString = function() {
    return time.toString(this.start) + ' - ' + time.toString(this.end) + ': ' +
        this.description;
}

/**
 * @param {string} text
 */
timeline.Event.prototype.parse = function(text) {
    var lines = text.split('\n');
    var stack = [this];
    var current = this;
    for (var i = 0; i < lines.length; i++) {
        var line = string.trim(lines[i]);
        var len = line.length;
        if (len === 0) {
            continue;
        }
        var heading = 0;
        while (heading * 2 < len && line.charAt(heading) == '=' && 
                line.charAt(len - heading - 1) == '=') {
            heading++;
        }
        if (heading > 0) {
            var title = line.substr(heading, len - 2 * heading);
            if (string.endsWith(title, " Eon") || string.endsWith(title, " Era") || 
                string.endsWith(title, " Period")) {
                var cut = title.lastIndexOf(' ');
                title = "[[" + title.substr(0, cut) + "]]" + title.substr(cut);
            } else {
                title = "[[" + title + "]]";
            }
            current = new timeline.Event(null, title);
            var parent = heading - 1;
            while (!stack[parent]) {
                console.log("level " + parent + " missing for heading: " + line);
                parent--;
            }
            stack[parent].add(current);
            stack[heading] = current;
        } else if (string.startsWith(line, '*')) {
            line = line.substr(1);
            var cut = line.indexOf(':');
            if (cut == -1) {
                window.console.log('":" expected in line: "' + line + '"');
            } else {
                current.add(new timeline.Event(line.substr(0, cut), line.substr(cut + 1)));
            }
        }
    }
    this.expand();
};

console.log(timeline);

