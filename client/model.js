var model = module.exports = exports = {};
var string = require('string');
var data = require('data');
var wiki = require('wiki');

/** 
 * @type {number}
 */
model.nextId = 0;

model.MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * Parses the given time to a number.
 * @param {string} s
 */
model.parseTime = function(s) {
    // TODO(haustein) Fix: Only replaces the first. 
    s = s.trim().replace(',', '');
    var original = s;
    if (string.startsWith(s, 'c.')) {
        s = s.substr(2).trim();
    }
    
    var cut = s.indexOf(' ');
    var unit = '';
    if (cut != -1) {
        unit = s.substr(cut + 1);
        s = s.substr(0, cut);
    }
    
    cut = s.indexOf('±');
    if (cut != -1) {
        s = s.substr(0, cut);
    }
    if (string.endsWith(s, 's')) {
        s = s.substr(0, s.length - 1);
    }
    
    var result = parseFloat(s);
    
    if (string.startsWith(unit, "Ma") ||
        string.startsWith(unit, "million years ago")) {
        result = 2013 - 1000000.0 * result;
    } else if (string.startsWith(unit, "years ago")) {
        result = 2013 - result;
    } else if (unit == 'BC' || unit == 'BCE') {
        result = -(result - 1);
    }

    if (isNaN(result)) {
        window.console.log("Not a number for '" + original + '"; unit: ' + unit);
    }

    return result;
};


/**
 * Formats the number by converting it to fixd point notation with the given
 * number of digits and inserting a '.' for every 3 digits in the integer part. 
 * 
 * @param {number} n The number to format
 * @param {number} fd Fraction digits to show.
 */
model.formatNumber = function(n, fd) {
    var positive = n < 0 ? -n : n;
    var s = positive.toFixed(fd);
    var cut = s.indexOf('.');
    if (cut == -1) {
        cut = s.length;
    }
    while (cut - 3 > 0) {
        cut -= 3;
        s = s.substr(0, cut) + ',' + s.substr(cut);
    }
    return n < 0 ? '-' + s : s;
};

/**
 * Converts the given time to a string.
 * 
 * @param {number} time
 */
model.timeToString = function(time, precision) {
    if (!precision) {
        precision = 1000000000;
    } else {
        precision = Math.abs(precision);
    }
    if (time-2013 <= -100000 && precision >= 1e4) {
        var nk;
        if (precision <  1e5) {
            nk = 2;
        } else if (precision < 1e6) {
            nk = 1;
        } else {
            nk = 0;
        }
        return model.formatNumber((time-2013) / -1000000.0, nk) + " Ma";
    }
    
    var year = Math.floor(time);
    // Don't show 1,970 instead of just 1970.
    var s = Math.abs(year) >= 10000 ? model.formatNumber(year, 0) : year.toFixed(0);
    if (year != time && time > 0 && precision < 1) {
        var index = Math.floor((time - year) * 12);
        s = model.MONTHS[index] + ". " + s;
    }
    return s;
};


model.intervalToString = function(interval) {
    var result = model.timeToString(interval.start);
    if (interval.end > interval.start) {
        result += " to " + model.timeToString(interval.end);
    }
    return result;
};


model.DASHES = ['–', '-', '—', ' to ', '&mdash;'];

/** 
 * Parses a time interval to the start and end properties of the given
 * target object.
 * 
 * @param {string} s
 * @param {{start: number, end: number}} target
 */
model.parseInterval = function(s, target) {
    var dash;
    var cut = -1;
    for (var i = 0; i < model.DASHES.length; i++) {
        dash = model.DASHES[i];
        cut = s.indexOf(dash);
        if (cut != -1) break;
    }
    
    if (cut == -1) {
        target.start = target.end = model.parseTime(s);
        return;
    }
    
    var s0 = s.substr(0, cut).trim();
    var s1 = s.substr(cut + dash.length).trim();
    
    // Copy the unit to the first time if only the second has one
    if (s0.length > 0 && s0.charAt(s0.length - 1) >= '0' && s0.charAt(s0.length - 1) <= '9') {
        var cut1 = s1.length - 1;
        while (cut1 > 0 && (s1.charAt(cut1) < '0' || s1.charAt(cut1) > '9')) {
            cut1--;
        }
        s0 = s0 + s1.substr(cut1 + 1);
    }
    
    target.start = model.parseTime(s0);
    target.end = model.parseTime(s1);
};



model.getColor = function(name) {
    var s = name.trim();
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
model.Event = function(timespan, description, opt_format, opt_section, opt_fetchChildren) {
    /** @type {model.Event} */
    this.parent = null;

    /** @type {number} */
    this.start = 1e100;
    
    /** @type {number} */
    this.end = -1e100;
    
    /** @type {string} */
    this.description = description;
    
    /** @type {array.<model.Event>} */
    this.children = [];
 
    /** @type {number} */
    this.id = "evt" + (model.nextId++);
  
    /** @type {string} */
    this.color = model.getColor(description);

    /** @type {Array} */
    this.format = opt_format;
    
    this.needsFetch = !!opt_format;

    this.section = opt_section;

    /** @type {Array.<string>} */
    this.fetchChildren = opt_fetchChildren;

    if (timespan) {
        model.parseInterval(timespan, this);
    }
    
    if (!this.needsFetch) {
        this.insertFetchableChildren();
    }
};
    
    
model.Event.prototype.insertFetchableChildren = function() {
    if (this.fetchChildren) {
        for (var i = 0; i < this.fetchChildren.length; i++) {
            var data = this.fetchChildren[i]; 
            //                             time     desc     format   section children
            var child = new model.Event(data[0], data[1], data[2], data[3], data[4]);
            this.insert(child);
        }
    }
};
    
    
model.Event.prototype.getHtml = function(callback) {
    var markup = this.description;
    if (string.startsWith(markup, "Timeline of ")) {
        markup = "[[" + markup.substr(12) + "]]";
    }
    return wiki.parse(markup, true);
};
    

model.Event.prototype.fetchData = function(callback) {
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
 * @param {model.Event} event
 */
model.Event.prototype.insert = function(event) {
    for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        if (child.start <= event.start && child.end >= event.end) {
            child.insert(event);
            return;
        }
    }
    this.append(event);
};

model.Event.prototype.append = function(event) {
    this.children.push(event);
    event.parent = this;
};


model.Event.prototype.expand = function(expandSelf) {
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


model.Event.prototype.normalize = function() {
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

model.Event.prototype.toString = function() {
    return model.timeToString(this.start) + ' – ' + model.timeToString(this.end) + ': ' +
        this.description;
};

/**
 * Parses sub events into the given event.
 * @param {string} text
 */
model.Event.prototype.parse = function(text) {
    var lines = text.split('\n');
    var stack = [this];
    var current = this;
    var format = this.format;
    var inSection = !this.section;
    var sectionLevel = 10000;
    var lastLeaf = null;
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
            current = new model.Event(null, title);
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
                    var childEvent = new model.Event(timespan, timespan + ': ' + description.trim());
                    childEvent.end = childEvent.start; // hack.

                    if (!isNaN(childEvent.start)) {
                        // Don't add a new event at the same time -- won't
                        // be accessible in the ui..
                        if (lastLeaf && lastLeaf.start == childEvent.start) {
                            lastLeaf.description += ' ' + childEvent.description;
                        } else {
                            current.append(childEvent);
                            lastLeaf = childEvent;
                        }
                    }
                }
            }
        }
    }
    this.expand(false);
    this.normalize();
};

console.log(model);

