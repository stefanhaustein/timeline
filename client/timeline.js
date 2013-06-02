var timeline = module.exports = exports = {};
var time = require('time');
var string = require('string');
var data = require('data');
var wiki = require('wiki');

/** 
 * @type {number}
 */
timeline.nextId = 0;

timeline.getColor = function(name) {
    var s = string.trim(name);
    var cut = name.indexOf(']]');
    if (cut != -1) {
        s = s.substring(0, cut);
    }
    s = s.replace('[[', '').toLowerCase();
    var rgb = data.colors[s];
    return rgb;
};

/**
 * @constructor
 * @param {string} timespan The unparsed time span of the event
 * @param {description} The description of the event
 */
timeline.Event = function(timespan, description, opt_format, opt_section, opt_fetchChildren) {
    /** @type {timeline.Event} */
    this.parent = null;

    /** @type {number} */
    this.start = 1e100;
    
    /** @type {number} */
    this.end = -1e100;
    
    /** @type {string} */
    this.description = description;
    
    /** @type {array.<timeline.Event>} */
    this.children = [];
 
    /** @type {number} */
    this.id = "evt" + (timeline.nextId++);
  
    /** @type {string} */
    this.color = timeline.getColor(description);

    /** @type {Array} */
    this.format = opt_format;
    
    this.needsFetch = !!opt_format;

    this.section = opt_section;

    /** @type {Array.<string>} */
    this.fetchChildren = opt_fetchChildren;

    if (timespan) {
        time.parseInterval(timespan, this);
    }
    
    if (!this.needsFetch) {
        this.insertFetchableChildren();
    }
};
    
    
timeline.Event.prototype.insertFetchableChildren = function() {
    if (this.fetchChildren) {
        for (var i = 0; i < this.fetchChildren.length; i++) {
            var data = this.fetchChildren[i]; 
            //                             time     desc     format   section children
            var child = new timeline.Event(data[0], data[1], data[2], data[3], data[4]);
            this.insert(child);
        }
    }
};
    
    
timeline.Event.prototype.getHtml = function(callback) {
    var markup = this.description;
    if (string.startsWith(markup, "Timeline of ")) {
        markup = "[[" + markup.substr(12) + "]]";
    }
    return wiki.parse(markup);
}
    
timeline.Event.prototype.fetchData = function(callback) {
    this.needsFetch = false;
    var self = this;
    wiki.fetchWikiText(this.description, function(text) {
        
        self.parse(text);
        self.insertFetchableChildren();
        callback();
    });
    return event;
};

    
/**
 * @param {timeline.Event} event
 */
timeline.Event.prototype.insert = function(event) {
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child.start <= event.start && child.end >= event.end) {
            child.insert(event);
            return;
        }
    }
    this.append(event);
};

timeline.Event.prototype.append = function(event) {
    this.children.push(event);
    event.parent = this;
};


timeline.Event.prototype.expand = function(expandSelf) {
    var changed = false;
    for (var i = this.children.length - 1; i >= 0; i--) {
        var child = this.children[i];
        child.expand(true);
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
        
        if (expandSelf) {
            if (child.start < this.start) {
                this.start = child.start;
                changed = true;
            }
            if (child.end > this.end) {
                this.end = child.end;
                changed = true;
            }
        }
    }
};


timeline.Event.prototype.toString = function() {
    return time.toString(this.start) + ' – ' + time.toString(this.end) + ': ' +
        this.description;
};

/**
 * Parses sub events into the given event.
 * @param {string} text
 */
timeline.Event.prototype.parse = function(text) {
    var lines = text.split('\n');
    var stack = [this];
    var current = this;
    var format = this.format;
    var inSection = !this.section;
    var sectionLevel = 10000;
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
           
            if (this.section) {
                if (title == this.section) {
                    inSection = true;
                    sectionLevel = heading;
                    continue;
                } else if (inSection) {
                    if (heading <= sectionLevel) {
                        inSection = false;
                        continue;
                    }
                } else {
                    continue;
                }
            }
            
            if (string.endsWith(title, " Eon") || string.endsWith(title, " Era") || 
                string.endsWith(title, " Period")) {
                var cut = title.lastIndexOf(' ');
                title = "[[" + title.substr(0, cut) + "]]" + title.substr(cut);
            } else if (title.indexOf('[[') == -1) {
                title = "[[" + title + "]]";
            }
            current = new timeline.Event(null, title);
            var parent = heading - 1;
            while (!stack[parent]) {
                console.log("level " + parent + " missing for heading: " + line);
                parent--;
            }
            stack[parent].append(current);
            stack[heading] = current;
        } else if (string.startsWith(line, format[0]) && inSection) {
            line = line.substr(format[0].length);
            var parts = line.split(format[1]);
            if (parts.length <= format[2] || parts.length <= format[3]) {
                window.console.log('expected more parts in ' + parts);
            } else {
                var timespan = string.trim(parts[format[2]]);
                timespan = timespan.split('[[').join();
                timespan = timespan.split(']]').join();
                
                var description = '';
                for (var j = format[3]; j < parts.length; j++) {
                    description += ' ' + string.trim(parts[j]);
                }
                
                if (timespan == '200,000 - 50,000 years ago') {
                    window.console.log('skipping: ' + line);
                } else {
                    current.append(new timeline.Event(timespan, string.trim(description)));
                }
            }
        }
    }
    this.expand(false);
};

console.log(timeline);

