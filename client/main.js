var timeline = require('timeline');

function render(parent, event) {
    var element = document.createElement("div");
    parent.appendChild(element);
    element.appendChild(document.createTextNode(event.toString() + '(' + event.children.length + ')'));
    element.setAttribute("style", "border: 1px solid black; margin-left: 20px; margin-bottom: -1px");
    for (var i = 0; i < event.children.length; i++) {
        render(element, event.children[i]);
    }
}

var naturalHistory = new timeline.Event("13,700 Ma - 0", "natural history");
var req = new XMLHttpRequest();
req.onload = function() {
    naturalHistory.parse(this.responseText);
    render(document.getElementById('timeline'), naturalHistory);
};
req.open('get', 'testdata.txt');
req.send();