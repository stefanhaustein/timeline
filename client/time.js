var time = module.exports = exports = {};
var string = require("string");

/**
 * Parses the given time to a number.
 * @param {string} s
 */
time.parse = function(s) {
    
    s = string.trim(s).replace(',', '');
    var original = s;
    if (string.startsWith(s, 'c.')) {
        s = string.trim(s.substr(2));
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
    
    var result = parseFloat(s);
    
    if (string.startsWith(unit, "Ma") ||
        string.startsWith(unit, "million years ago")) {
        result *= -1000000.0;
    } 

    if (isNaN(result)) {
        window.console.log("Not a number for '" + original + '"; unit: ' + unit);
    }

    return result;
};

/**
 * Converts the given time to a string.
 * @param {number} time
 */
time.toString = function(time) {
    if (time < -10000) {
        return "" + (time / -1000000.0).toFixed(2) + " Ma";
    } 
    return "" + time.toFixed(0);
};

/** 
 * Parses a time interval to the start and end properties of the given
 * target object.
 * 
 * @param {string} s
 * @param {{start: number, end: number}} target
 */
time.parseInterval = function(s, target) {
    var cut = s.indexOf('–');
    if (cut == -1) {
        cut = s.indexOf('-');
    }
    if (cut == -1) {
        target.start = target.end = time.parse(s);
        return;
    }
    
    var s0 = string.trim(s.substr(0, cut));
    var s1 = string.trim(s.substr(cut + 1));
    
    // Copy the unit to the first time if only the second has one
    if (s0.length > 0 && s0.charAt(s0.length - 1) >= '0' && s0.charAt(s0.length - 1) <= '9') {
        var cut1 = s1.length - 1;
        while (cut1 > 0 && (s1.charAt(cut1) < '0' || s1.charAt(cut1) > '9')) {
            cut1--;
        }
        s0 = s0 + s1.substr(cut1 + 1);
    }
    
    target.start = time.parse(s0);
    target.end = time.parse(s1);
};

