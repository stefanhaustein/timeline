var wiki = module.exports = exports = {};

/**
 * Parses wiki text to plain text or html, depnding on the toHtml parameter.
 * 
 * @param {string} s The wikitext to parse.
 * @param {boolean} html Whether to parse to html (true) or plain text (false).
 * @return {string} The parsed output.
 */
wiki.parse = function(s, toHtml) {
    var pos = 0;
    while(true) {
        var cut0 = s.indexOf("[[", pos);
        if (cut0 == -1) break;
        var cut1 = s.indexOf("]]", cut1 + 2);
        if (cut1 == -1) break;
        var ww = s.substring(cut0 + 2, cut1);
        var cut2 = ww.indexOf('|', cut0 + 2);
        var link, label;
        if (cut2 == -1) {
            link = label = ww;
        } else {
            link = ww.substr(0, cut2);
            label = ww.substr(cut2+1);
        }
        if (toHtml) {
            s = s.substr(0, cut0) + '<a href="#' + link + '">' + label + "</a>" + s.substr(cut1 + 2);
        } else {
            s = s.substr(0, cut0) + label + s.substr(cut1 + 2);
        }
        pos = cut0;  // conservative
    }
    
    // use regexp?
    pos = 0;
    while(true) {
        var cut0 = s.indexOf("{{", pos);
        if (cut0 == -1) break;
        var cut1 = s.indexOf('}}', cut0 + 2);
        if (cut1 == -1) break;
        s = s.substr(0, cut0) + s.substring(cut1 + 2);
        pos = cut1 - 4;
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

