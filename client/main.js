var timeline = require('timeline');

var rootElement = document.getElementById('timeline');

function render(parent, prefix, event, timeOffset, parentY, remainingWidth, remainingHeight, scale) {
    var y = (event.start - timeOffset) * scale;
    var height = (event.end - event.start) * scale;
    var top = y - parentY;

    var element = document.getElementById(event.id);
    var textTop = y < 0 ? -y : 0; 

    var textDiv;
    var containerDiv; 
    if (element == null) {
        element = document.createElement("div");
        element.setAttribute("id", event.id);
        containerDiv = document.createElement("div");
        textDiv = document.createElement("div");
        parent.appendChild(element);
        element.appendChild(textDiv);
        element.appendChild(containerDiv);
    } else {
        textDiv = element.firstChild;
        containerDiv = textDiv.nextSibling;
    }

    element.setAttribute("style", 
        "overflow:hidden;display:block;border: 1px solid black; margin:-1px;position: absolute; top:" + top + 
        "px; height:"+ height + "px; width:" + remainingWidth + "px;");

    var fullscreenChild = -1;
    for(var i = 0; i < event.children.length; i++) {
        var child = event.children[i];
        var cy0 = (child.start - timeOffset) * scale;
        var cy1 = (child.end - timeOffset) * scale;
        if (cy0 <= 0 && cy1 > remainingHeight) {
            fullscreenChild = i;
            break;
        }
    }

    if (fullscreenChild == -1) {
        remainingWidth -= 100;
        textDiv.setAttribute("style", "width:100px;position:relative;top:"+textTop);
        containerDiv.setAttribute("style",
           "position:absolute;left:100px;top:0;height:"+height+";width:"+ remainingWidth + "px");
        textDiv.innerHTML = prefix + event.description;
        prefix = "";
    } else {
        textDiv.setAttribute("style", "display:none");
        containerDiv.setAttribute("style",
            "position:absolute;top:0;left:0;height:"+height+";width:"+ remainingWidth + "px");
        prefix += event.description + ":<br>";
    }

    if (remainingWidth < 100 || height <= 20) {
        containerDiv.innerHTML = "";
        return;
    }
    
    for (var i = 0; i < event.children.length; i++) {
        render(containerDiv, prefix, event.children[i], timeOffset, y, 
               remainingWidth, remainingHeight, scale);
    }
}

var timeOffset = -13700000000;
var minScale = window.innerHeight / 13700000000;
var timeScale = minScale;

document.onkeydown = function(event) {
    console.log(event);
    var char = event.which == null ? event.keyCode : event.which;
    if (char === 187) {
        timeScale *= 3.0/2.0;
    } else if (char === 189) {
        timeScale *= 2.0/3.0;
        if (timeScale < minScale/2) {
            timeScale = minScale/2;
        }
    } else if (char === 38) {
        timeOffset -= 5 / timeScale;
    } else if (char === 40) {
        timeOffset += 5 / timeScale;
    } else {
        return;
    }
    window.console.log("new scale: "+ timeScale);
    update();
}

function update() {
    rootElement.style.width = window.innerWidth + "px";
    rootElement.style.height = window.innerHeight + "px";
    
    render(rootElement, "", naturalHistory, timeOffset, 0, 
           window.innerWidth, window.innerHeight, timeScale);
}
    
var naturalHistory = new timeline.Event("13,700 Ma - 0", "natural history");
var req = new XMLHttpRequest();
req.onload = function() {
    naturalHistory.parse(this.responseText);
    update();
};
req.open('get', 'testdata.txt');
req.send();