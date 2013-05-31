var wiki = module.exports = exports = {};

wiki.TIMELINES = [
    "13,700 Ma - 0: Timeline of natural history",
    "200,000 - 5,500 years ago: Timeline of human prehistory"
];


wiki.parse = function(s) {
    while(true) {
        var cut0 = s.indexOf("[[");
        if (cut0 == -1) break;
        var cut1 = s.indexOf("]]");
        if (cut1 == -1) break;
        var ww = s.substring(cut0 + 2, cut1);
        var cut2 = ww.indexOf('|');
        var link, label
        if (cut2 == -1) {
            link = label = ww;
        } else {
            link = ww.substr(0, cut2);
            label = ww.substr(cut2+1);
        }
        
        s = s.substr(0, cut0) + '<a href="#' + link + '">' + label + "</a>" + s.substring(cut1 + 2);
    }
    return s;
};


wiki.fetchHtml = function(title, callback) {
    var callbackName = "globaljsonpcallback";
    window[callbackName] = function(response) {
        console.log(response);
        callback(response['parse']['text']);
    };
    var url = "http://en.wikipedia.org/w/api.php?action=parse&redirects&mobileformat=html&format=json&page=" +
        encodeURIComponent(title) + "&callback=" + callbackName;
    var script = document.createElement('script');
    script.setAttribute('src', url);
    document.getElementsByTagName('head')[0].appendChild(script);
};

wiki.fetchWikiText = function(title, callback) {
    var callbackName = "globaljsonpcallback";
    window[callbackName] = function(response) {
        console.log(response);
        var pages = response['query']['pages'];
        for (var id in pages) {
            var page = pages[id];
            callback(page['revisions'][0]['*']);
        };
    };
    var url = "http://en.wikipedia.org/w/api.php?action=query&redirects&prop=revisions&rvprop=content&format=json&titles=" +
        encodeURIComponent(title) + "&callback=" + callbackName;
    console.log("fetchWikiText: " + url);
    var script = document.createElement('script');
    script.setAttribute('src', url);
    document.getElementsByTagName('head')[0].appendChild(script);
};

