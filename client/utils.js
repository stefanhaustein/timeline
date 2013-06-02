var cache = {
    string: {
        endsWith: function(s, w) {
            return s.indexOf(w, s.length - w.length) != -1;
        },
        startsWith: function(s, w) {
            return s.lastIndexOf(w, 0) != -1;
        },
        trim: function(s) {
            return s.trim();
        }
    },
    quirks: {
        getNormalizedWheelDeltaY: function(e) {
            var dy = e.wheelDeltaY / 3.0;
            window.console.log("wheelDeltaY: " + e.wheelDeltaY + "; normalized: " + dy);
            return dy;
        }
    }
}; 

function load(names, opt_index) {
    var index = opt_index ? opt_index : 0;
    if (index >= names.length) {
        return;
    }
    var name = names[index];
    window.module = {exports: {}};
    window.exports = module.exports;
    
    //  window.console.log('load: requesting: ' + name);
    var script = document.createElement('script');
    script.onload = function() {
        cache[name] = module.exports;
        window.console.log('load: loaded: ' + name);
        window.console.log(module.exports);
        load(names, index + 1);
    };
    script.src = name + ".js";
    window.console.log('script src: ' + script.src);
    document.getElementsByTagName('head')[0].appendChild(script);
}

function require(name) {
    var result = cache[name]; 
    if (!result) throw 'Not preloaded: "' + name + '"';
    return result;
}