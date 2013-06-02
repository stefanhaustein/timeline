var wiki = module.exports = exports = {};

wiki.FORMAT_LIST = ['*', ':', 0, 1];

wiki.TIMELINES = [
    "13,700 Ma - 2013", "Timeline of natural history", wiki.FORMAT_LIST, null, [
        ["200,000 years ago - 2013", "Timeline of human history", null, null, [
            ["200,000 - 5,500 years ago", "Timeline of human prehistory", wiki.FORMAT_LIST],
            ["5,500 years ago - 476", "Timeline of ancient history", wiki.FORMAT_LIST],
            ["476 - 1500", "Timeline of the Middle Ages", ['|', '||', 0, 2]],
            ["1500 - 1900", "Timeline of early modern history", null, null, [ 
                ["1500 - 1600", "16th_century", wiki.FORMAT_LIST, "Events"],
                ["1600 - 1700", "17th_century", wiki.FORMAT_LIST, "Events"],
                ["1700 - 1800", "18th_century", wiki.FORMAT_LIST, "Events"],
                ["1800 - 1900", "19th_century", wiki.FORMAT_LIST, "Events"],
            ]],
            ["1900 - 2013", "Timeline of modern history", wiki.FORMAT_LIST]
        ]]
    ]
];

wiki.GLOBES = [
    [-13700e6, "3/3c/Ilc_9yr_moll4096.png"],
    [-13600e6, "4/4d/Spirit_Rover-Mars_Night_Sky.jpg"],
    [-13100e6, "6/69/Hubble_-_infant_galaxy.jpg"],
    [-13000e6, "2/2f/Hubble_ultra_deep_field.jpg"],
    [ -4566e6, "7/71/Protoplanetary-disk.jpg"],
    [ -4533e6, "b/b8/Giantimpact.gif"],
    [ -4530e6, "e/ed/Rodinia.png"], // placeholder
    [  -600e6, "e/e9/Blakey_600moll.jpg"],
    [  -560e6, "7/7d/Blakey_560moll.jpg"],
    [  -500e6, "c/ca/Blakey_500moll.jpg"],
    [  -470e6, "8/8a/Blakey_470moll.jpg"],
    [  -450e6, "3/31/Blakey_450moll.jpg"],
    [  -430e6, "8/88/Blakey_430moll.jpg"],
    [  -400e6, "c/cc/Blakey_400moll.jpg"],
    [  -370e6, "9/90/Blakey_370moll.jpg"],
    [  -340e6, "3/3f/Blakey_340moll.jpg"],
    [  -300e6, "8/87/Blakey_300moll.jpg"],
    [  -280e6, "5/5c/Blakey_280moll.jpg"],
    [  -260e6, "3/3d/Blakey_260moll.jpg"],
    [  -240e6, "6/6f/Blakey_240moll.jpg"],
    [  -220e6, "e/e6/Blakey_220moll.jpg"],
    [  -200e6, "f/f2/Blakey_200moll.jpg"],
    [  -170e6, "a/a8/Blakey_170moll.jpg"],
    [  -150e6, "3/34/Blakey_150moll.jpg"],
    [  -105e6, "6/6c/Blakey_105moll.jpg"],
    [   -90e6, "d/dc/Blakey_90moll.jpg"],
    [   -65e6, "1/10/Blakey_65moll.jpg"],
    [   -50e6, "b/ba/Blakey_50moll.jpg"],
    [   -35e6, "7/73/Blakey_35moll.jpg"],
    [   -20e6, "2/2c/Blakey_20moll.jpg"],
    [    -5e6, "7/7e/Blakey_Pleistmoll.jpg"],
    [    -2e6, "b/b2/Blakey_presentmoll.jpg"]
];


// start, Label,          o2,  co2, tmp, sea, image
wiki.ENVIRONMENT = [
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
    
    while(true) {
        var cut0 = s.indexOf("{{");
        if (cut0 == -1) break;
        var cut1 = s.indexOf('}}');
        if (cut1 == -1) break;
        s = s.substr(0, cut0) + s.substring(cut1 + 2);
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

