var wiki = module.exports = exports = {};

/**
 * Parses wiki text to plain text or html, depnding on the toHtml parameter.
 * 
 * @param {string} wt The wikitext to parse.
 * @param {boolean} html Whether to parse to html (true) or plain text (false).
 * @return {string} The parsed output.
 */
wiki.parse = function(wt, toHtml) {
    var pos = 0; // start pos for plain copying from wt.
    var s = '';
    var end, cut;
    var len = wt.length;
    for (var i = 0; i < len; i++) {
        var d = (i + 1 < len ? wt.charAt(i + 1) : '');
        switch(wt.charAt(i)) {
            case '<':
                s += wt.substring(pos, i);
                end = wt.indexOf('>', i + 1);
                if (end == -1) {
                    s += toHtml ? "&lt;" : "<";
                    pos = i + 1;
                } else {
                    if (toHtml) {
                        var tag = wt.substring(i, end);
                        if (tag == "<sup>" || tag == "</sup>" || tag == "<ref>" || tag == "</ref>") {
                            s += tag;
                        }
                    }
                    pos = end + 1;
                }
                break;
            case '_': 
                s += wt.substring(pos, i) + ' ';
                pos = i + 1;
                break;
            case '[':
                if (d != '[') break;
                end = wt.indexOf("]]", i + 2);
                if (end == -1) break;
                var link = wt.substring(i + 2, end);
                var label = link;
                cut = link.indexOf('|');
                if (cut != -1) {
                    label = label.substr(cut + 1);
                    link = link.substr(0, cut);
                }
                s += wt.substring(pos, i);
                if (toHtml) {
                    s += '<a href="#' + link + '">' + label + "</a>";
                } else {
                    s += label;
                }
                pos = end + 2;
                break;
            case '{':
                if (d != '{') break;
                end = wt.indexOf('}}', i + 2);
                if (end == -1) break;
                s += wt.substring(pos, i);
                pos = end + 2;
                break;
        }
        if (i < pos) i = pos - 1;
    }
    
    s += wt.substr(pos);
    
    //console.log("Wikitext:  " + wt);
    //console.log("Converted: " + s);
    
    return s;
};

wiki.callbackId = 0;

wiki.fetchHtml = function(title, callback) {
    var callbackName = "globaljsonpcallback" + wiki.callbackId++;
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
    var callbackName = "globaljsonpcallback" + wiki.callbackId++;
    window[callbackName] = function(response) {
        delete window[callbackName];
        var pages = response.query && response.query.pages;
        if (!pages) {
            console.log('fetchWikiText error; response for "' + title + '"');
            console.log(response);
        } else {
            for (var id in pages) {
                var page = pages[id];
                callback(page.revisions[0]['*']);
            }
        }
    };
    var url = "http://en.wikipedia.org/w/api.php?action=query&redirects&prop=revisions&rvprop=content&format=json&titles=" +
        encodeURIComponent(title) + "&callback=" + callbackName;
    console.log("fetchWikiText: " + url);
    var script = document.createElement('script');
    script.setAttribute('src', url);
    document.getElementsByTagName('head')[0].appendChild(script);
};

