var wiki = module.exports = exports = {};

wiki.TIMELINES = [
    "13,700 Ma - 2013: Timeline of natural history",
    "200,000 - 5,500 years ago: Timeline of human prehistory"
];

     // start, Label,          o2,  co2, tmp, sea, image
wiki.GLOBAL = [
    [-13000e6, "Big Bang",    null, null,null,null, "3/3c/Ilc_9yr_moll4096.png"],
    [-635.0e6, "Edicaran",     8.0, 4500,null,null, "e/e9/Blakey_600moll.jpg"],
    [-541.0e6, "Cambrian",    12.5, 4500,  21,  60, "c/ca/Blakey_500moll.jpg"],
    [-485.4e6, "Ordovician",  13.5, 4200,  16, 180, "3/31/Blakey_450moll.jpg"],
    [-443.4e6, "Silurian",    14.0, 4500,  17, 180, "8/88/Blakey_430moll.jpg"],
    [-419.2e6, "Devonian",    15.0, 2200,  20, 150, "9/90/Blakey_370moll.jpg"],
    [-358.9e6, "Carboniferus",32.5,  800,  14,   0, "8/87/Blakey_300moll.jpg"],
    [-298.9e6, "Permian",     23.0,  900,  16,  40, "3/3d/Blakey_260moll.jpg"],
    [-252.2e6, "Triassic",    16.0, 1750,  17,   0, "e/e6/Blakey_220moll.jpg"],
    [-201.3e6, "Jurassic",    26.0, 1950,  16.5, 0, "3/34/Blakey_150moll.jpg"],
    [-145.0e6, "Cretaceous",  30.0, 1700,  18,   0, "d/dc/Blakey_90moll.jpg"],
    [-66e6,    "Paleogene",   26.0,  500,  18,   0, "7/73/Blakey_35moll.jpg"],
    [-23.03e6, "Neogene",     21.5,  280,  14,   0, "2/2c/Blakey_20moll.jpg"],
    [-2.58e6,  "Quaternary",  20.8,  250,  14,   0, "b/b2/Blakey_presentmoll.jpg"]
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

