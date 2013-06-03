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
    var timeStep = Math.max(Math.pow(10, digits), 1);
    var pixelStep = timeStep * timeScale;
    
    // start two steps up.
    var t = (Math.round(timeOffset / timeStep) - 2) * timeStep;
    var test1 = time.parse(time.toString(t));
    var test2 = time.parse(time.toString(t + timeStep));
    var useKey = Math.abs(test1 - t) > timeStep / 10 || 
        Math.abs(test2 - (t + timeStep)) > timeStep;
    
    this.epoch++;

    var subDivision;
    var halfDash = "–";
    if (pixelStep < 24) {
        timeStep *= 2;
        subDivision = 2;
        halfDash = "—";
    } else { 
        subDivision = pixelStep > 64 ? 4 : pixelStep > 32 ? 2 : 1; 
    }
    var subStep = 0;
    
    while(true) {
        var key =  "" + t;
        var child = this.elements[key];
        if (!child) {
            var child = document.createElement("div");
            child.className = 'timeStep';
            this.element.appendChild(child);
            this.elements[key] = child;
        }
        var label;
        switch(subStep * (4/subDivision) % 4) {
            case 0: 
                label = (useKey ? key : time.toString(t)) + " —";
                break;
            case 2:
                label = halfDash;
                break;
            default:
                label = "-";
        }
        child.innerHTML = label;
        var y = Math.round((t - timeOffset) * timeScale);
        
        child.style.top = y - child.offsetHeight / 2;
        child['_epoch_'] = this.epoch;
        if (y > viewportHeight) {
            break;
        }
        t += timeStep/subDivision;
        subStep++;
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
