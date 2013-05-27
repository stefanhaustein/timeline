var time = module.exports = exports = {};
var string = require("string");

/**
 * Parses the given time to a number.
 * @param {string} s
 */
time.parse = function(s) {
    s = string.trim(s).replace(',', '');
    if (string.endsWith(s, "Ma")) {
        return parseFloat(string.trim(s.substr(0, s.length - 2))) * -1000000.0;
    }
    return parseFloat(s);
};

/**
 * Converts the given time to a string.
 * @param {number} time
 */
time.toString = function(time) {
    if (time < -100000) {
        return "" + (time / -1000000.0) + " Ma";
    } 
    return "" + time;
};

/** 
 * Parses a time interval to the start and end properties of the given
 * target object.
 * 
 * @param {string} s
 * @param {{start: number, end: number}} target
 */
time.parseInterval = function(s, target) {
    var cut = s.indexOf('-');
    if (cut == -1) {
        target.start = target.end = time.parse(s);
        return;
    }
    
    var s0 = string.trim(s.substr(0, cut));
    var s1 = string.trim(s.substr(cut + 1));
    
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

