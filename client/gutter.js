var gutter = module.exports = exports = {};

var time = require('time');

gutter.Gutter = function(element) {
    this.element = element;   
    this.elements = {};
    this.epoch = 0;
};


gutter.Gutter.prototype.update = function(timeOffset, timeScale) {
    var viewportHeight = this.element.offsetHeight;
        
    var idealStepCount = viewportHeight / 50;    
    var idealStep = viewportHeight / idealStepCount;
    var idealTimeStep = idealStep / timeScale;
        
    var digits = Math.round(Math.log(idealTimeStep) / Math.log(10));
    var timeStep = Math.pow(10, digits);
    var pixelStep = timeStep * timeScale;
    if (pixelStep > idealStep * 1.5) {
        timeStep /= 2;
    } else if (pixelStep < idealStep / 1.5) {
        timeStep *= 2.5;
    }
    var t = (Math.round(timeOffset / timeStep) - 2) * timeStep;
    var test1 = time.parse(time.toString(t));
    var test2 = time.parse(time.toString(t + timeStep));
    var useKey = Math.abs(test1 - t) > timeStep / 10 || 
        Math.abs(test2 - (t + timeStep)) > timeStep;
    
    this.epoch++;
    var hideLabel = false;
    while(true) {
        var key =  "" + t;
        var child = this.elements[key];
        if (!child) {
            var child = document.createElement("div");
            child.className = 'timeStep';
            this.element.appendChild(child);
            this.elements[key] = child;
        }
        var label = hideLabel ? '' : (useKey ? key : time.toString(t));
        child.innerHTML = label + " –";
        var y = Math.round((t - timeOffset) * timeScale);
        child.style.top = y - child.offsetHeight / 2;
        child['_epoch_'] = this.epoch;
        if (y > viewportHeight) {
            break;
        }
        t += timeStep/2;
        hideLabel = !hideLabel;
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
