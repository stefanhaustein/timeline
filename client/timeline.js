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
    return wiki.parse(markup, true);
};
    

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
    // Expand children as needed.
    for (var i = this.children.length - 1; i >= 0; i--) {
        var child = this.children[i];
        child.expand(true);
        // Remove erratic children 
        if (child.start > child.end) {
            this.children.splice(i, 1);
            continue;
        }
    }
    
    // Expand self to fit children if permitted.
    var count = this.children.length;
    if (expandSelf) {
        // Can we determine the span from the name?
        
        var title = wiki.parse(this.description, false);
        if (/^\d\d?th century$/.test(title)) {
            var century = parseInt(title.substr(0, title.indexOf('t')), 10);
            this.start = (century - 1) * 100;
            this.end = century * 100;
        } else if (/^\d\d\d\ds$/.test(title)) {
            this.start = parseInt(title.substr(0, 4), 10);
            this.end = this.start + 10;
        } else if (count > 0) {
            if (this.children[0].start < this.start) {
                this.start = this.children[0].start;
            }
            if (this.children[count - 1].end > this.end) {
                this.end = this.children[count - 1].end;
            }
        }
    } 
};


timeline.Event.prototype.normalize = function() {
    var count = this.children.length;
    for (var i = 0; i < count; i++) {
        var child = this.children[i];
        var end = i < count - 1 ? this.children[i + 1].start : this.end;
        if (child.start != child.end || child.children.length > 0) {
            if (child.start < this.start) {
                child.start = this.start;
            }
            child.end = end;
            child.normalize();
        }
    }
    for (var i = count - 1; i >= 0; i--) {
        var child = this.children[i];
        if (child.start < this.start || child.end > this.end) {
            this.children.splice(i, 1);
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
        var line = lines[i].trim();
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
            var title = line.substr(heading, len - 2 * heading).trim();
            var parsedTitle = wiki.parse(title, false).trim();

            if (this.section) {
                if (parsedTitle == this.section) {
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
            
            // No extra sections for pure numeric titles (1930s, 17th century).
            if (/\d\d\d\ds/.test(parsedTitle) || /Undated/.test(parsedTitle) ||
                /centur(y|ies)/.test(parsedTitle)) {
                continue;
            }
            
            if (/ Eon$/.test(parsedTitle) || / Era$/.test(parsedTitle) || 
                / Period$/.test(parsedTitle)) {
                var cut = parsedTitle.lastIndexOf(' ');
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
                var timespan = parts[format[2]].trim();
                timespan = wiki.parse(timespan, false);
                
                var description = '';
                for (var j = format[3]; j < parts.length; j++) {
                    if (description.length > 0) {
                        description += format[1] == ':' ? ': ' : ' ';
                    }
                    description += string.trim(parts[j]);
                }
                
                if (timespan == '200,000 - 50,000 years ago') {
                    window.console.log('skipping: ' + line);
                } else {
                    var childEvent = new timeline.Event(timespan, timespan + ': ' + string.trim(description));
                    childEvent.end = childEvent.start; // hack.
                    if (!isNaN(childEvent.start)) {
                        current.append(childEvent);
                    }
                }
            }
        }
    }
    this.expand(false);
    this.normalize();
};

console.log(timeline);

