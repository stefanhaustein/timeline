var data = module.exports = exports = {};

data.FORMAT_LIST = ['*', ':', 0, 1];

data.TIMELINES = [
    "13,700 Ma - 2013", "Timeline of natural history", data.FORMAT_LIST, null, [
        ["200,000 years ago - 2013", "Timeline of human history", null, null, [
            ["200,000 - 5,500 years ago", "Timeline of human prehistory", data.FORMAT_LIST],
            ["5,500 years ago - 476", "Timeline of ancient history", data.FORMAT_LIST],
            ["476 - 1500", "Timeline of the Middle Ages", ['|', '||', 0, 2]],
            ['1500 - 2013', 'Modern History', null, null, [
                ["1500 - 1900", "Timeline of early modern history", null, null, [ 
                    ["1500 - 1600", "16th century", data.FORMAT_LIST, "Events"],
                    ["1600 - 1700", "17th century", data.FORMAT_LIST, "Events"],
                    ["1700 - 1800", "18th century", data.FORMAT_LIST, "Events"],
                    ["1800 - 1900", "19th century", data.FORMAT_LIST, "Events"],
                ]],
                ["1900 - 2013", "Timeline of modern history", data.FORMAT_LIST],
            ]],
        ]]
    ]
];

data.GLOBES = [
    [-13770e6, "Infant universe, ", "3/3c/Ilc_9yr_moll4096.png", true],
    [-13100e6, "Infant galaxy", "6/69/Hubble_-_infant_galaxy.jpg", true, 0.5],
    [-13000e6, "Hubble looking back to", "2/2f/Hubble_ultra_deep_field.jpg", true, 0.5],
    [ -4566e6, "Protoplanetary disk", "7/71/Protoplanetary-disk.jpg", true],
    [ -4533e6, "Theia impact", "b/b8/Giantimpact.gif", true, 0.5],
    [ -4530e6, "Ancient Earth", "e/ed/Rodinia.png", true], // placeholder
    [  -600e6, "Global paleogeography,", "e/e9/Blakey_600moll.jpg", true],
    [  -560e6, "Global paleogeography,", "7/7d/Blakey_560moll.jpg", true],
    [  -500e6, "Global paleogeography,", "c/ca/Blakey_500moll.jpg", true],
    [  -470e6, "Global paleogeography,", "8/8a/Blakey_470moll.jpg", true],
    [  -450e6, "Global paleogeography,", "3/31/Blakey_450moll.jpg", true],
    [  -430e6, "Global paleogeography,", "8/88/Blakey_430moll.jpg", true],
    [  -400e6, "Global paleogeography,", "c/cc/Blakey_400moll.jpg", true],
    [  -370e6, "Global paleogeography,", "9/90/Blakey_370moll.jpg", true],
    [  -340e6, "Global paleogeography,", "3/3f/Blakey_340moll.jpg", true],
    [  -300e6, "Global paleogeography,", "8/87/Blakey_300moll.jpg", true],
    [  -280e6, "Global paleogeography,", "5/5c/Blakey_280moll.jpg", true],
    [  -260e6, "Global paleogeography,", "3/3d/Blakey_260moll.jpg", true],
    [  -240e6, "Global paleogeography,", "6/6f/Blakey_240moll.jpg", true],
    [  -220e6, "Global paleogeography,", "e/e6/Blakey_220moll.jpg", true],
    [  -200e6, "Global paleogeography,", "f/f2/Blakey_200moll.jpg", true],
    [  -170e6, "Global paleogeography,", "a/a8/Blakey_170moll.jpg", true],
    [  -150e6, "Global paleogeography,", "3/34/Blakey_150moll.jpg", true],
    [  -105e6, "Global paleogeography,", "6/6c/Blakey_105moll.jpg", true],
    [   -90e6, "Global paleogeography,", "d/dc/Blakey_90moll.jpg", true],
    [   -65e6, "Global paleogeography,", "1/10/Blakey_65moll.jpg", true],
    [   -50e6, "Global paleogeography,", "b/ba/Blakey_50moll.jpg", true],
    [   -35e6, "Global paleogeography,", "7/73/Blakey_35moll.jpg", true],
    [   -20e6, "Global paleogeography,", "2/2c/Blakey_20moll.jpg", true],
    [    -5e6, "Global paleogeography,", "7/7e/Blakey_Pleistmoll.jpg", true],
    [    -2e6, "Global paleogeography,", "b/b2/Blakey_presentmoll.jpg", true],
    [    -400, "World map", "f/fa/World_Map_400_BCE.PNG"],
    [    -300, "World map", "e/ea/World_in_300_BCE.PNG"],
    [    -100, "World map", "9/94/World_in_100_BCE.PNG"],
    [     -50, "World map", "3/3c/World_in_50_BCE.PNG"],
    [       1, "World map", "4/47/World_1_CE.PNG"],
    [      50, "World map", "5/5f/World_in_50_CE.PNG"],
    [     100, "World map", "5/50/World_in_100_CE.PNG"],
    [     200, "World map", "2/2e/World_in_200_CE.PNG"],
    [     250, "World map", "b/bd/World_map_250_CE.png"],
    [     300, "World map", "8/85/World_in_300_CE.PNG"],
    [     400, "World map", "9/90/World_Map_400_CE.PNG"],
    [     500, "World map", "f/f7/The_world_in_500_CE.PNG"],
    [     700, "World map", "5/51/World_Map_700_CE.PNG"],
    [     750, "World map", "c/cd/The_world_in_750_CE.PNG"],
    [     900, "World map", "8/81/World_Map_900_CE.PNG"],
    [    1492, "Colonisation", "9/93/Colonisation_1492.png"],
    [    1550, "Colonisation", "9/90/Colonisation_1550.png"],
    [    1660, "Colonisation", "7/74/Colonisation_1660.png"],
    [    1754, "Colonisation", "c/ca/Colonisation_1754.png"],
    [    1800, "Colonisation", "2/2b/Colonisation_1800.png"],
  //  [    1898, "2/24/World_1898_empires_colonies_territory.png"],
    [    1914, "Colonisation", "e/e2/Colonisation_1914.png"],
  //  [    1920, "4/40/World_1920_empires_colonies_territory.png"],
//    [    1936, "2/20/World_1936_empires_colonies_territory.png"],
    [    1938, "Colonisation", "4/4d/Colonisation_1938.png"],
    [    1945, "Colonisation", "a/a9/Colonization_1945.png"],
    [    1959, "Cold War", "5/55/Cold_War_Map_1959.png"],
    [    1980, "Cold War", "f/ff/Cold_War_Map_1980.png"],
    [    2007, "Colonisation", "d/d6/Colonisation_2007.png"]
];


// start, Label,          o2,  co2, tmp, sea, image
data.ENVIRONMENT = [
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


data.colors = {  
  'timeline of natural history': [0,0,0],
  'formation of the universe': [0,0,128],
  
  precambrian             : [247, 67, 112],

  phanerozoic             : [154, 217, 221],
  proterozoic             : [247, 53, 99],
  archaean                 : [240, 4, 127],
  hadean                  : [174, 2, 126],

  cenozoic                : [242, 249, 29],
  mesozoic                : [103, 197, 202],
  paleozoic               : [153, 192, 141],

  neoproterozoic          : [254, 179, 66],
  mesoproterozoic         : [253, 180, 98],
  paleoproterozoic        : [247, 67, 112],
  neoarchaean             : [249, 155, 193],
  mesoarchaean            : [247, 104, 169],
  paleoarchaean           : [244, 68, 159],
  eoarchaean              : [218, 3, 127],

/* Periods */

  quaternary              : [249, 249, 127],
  neogene                 : [255, 230, 25],
  paleogene               : [253, 154, 82],

  cretaceous              : [127, 198, 78],
  jurassic                : [52, 178, 201],
  triassic                : [129, 43, 146],

  permian                 : [240, 64, 40],
  carboniferous           : [103, 165, 153],
  devonian                : [203, 140, 55],
  silurian                : [179, 225, 182],
  ordovician              : [0, 146, 112],
  cambrian                : [127, 160, 86],

  ediacaran               : [254, 217, 106],
  cryogenian              : [254, 204, 92],
  tonian                  : [254, 191, 78],
  stenian                 : [254, 217, 154],
  ectasian                : [253, 204, 138],
  calymmian               : [253, 192, 122],
  statherian              : [248, 117, 167],
  orosirian               : [247, 104, 152],
  rhyacian                : [247, 91, 137],
  siderian                : [247, 79, 124],

  pennsylvanian           : [153, 194, 181],
  mississippian           : [141, 143, 102],
  holocene                : [254, 242, 236],
  pleistocene             : [255, 242, 174],
  pliocene                : [255, 255, 153],
  miocene                 : [255, 255, 0],
  oligocene               : [253, 192, 122],
  eocene                  : [253, 180, 108],
  paleocene               : [253, 167, 95],
  'upper cretaceous'      : [166, 216, 74],
  'lower cretaceous'      : [140, 205, 87],

  'upper jurassic'        : [179, 227, 239],
  'middle jurassic'       : [128, 207, 216],
  'lower jurassic'        : [ 66, 174, 208],

  'upper triassic'        : [189, 140, 195],
  'middle triassic'       : [177, 104, 177],
  'lower triassic'        : [125,  57, 153],
  lopingian               : [251, 167, 148],
  guadalupian             : [251, 116, 92],
  cisuralian              : [239,  88, 69],

  'upper pennsylvanian'   : [191, 208, 186],
  'middle pennsylvanian'  : [166, 199, 183],
  'lower pennsylvanian'   : [140, 190, 180],
  'upper mississippian'   : [179, 190, 108],
  'middle mississippian'  : [153, 180, 108],
  'lower mississippian'   : [128, 171, 108],

  'upper devonian'        : [241, 225, 157],
  'middle devonian'       : [241, 200, 104],
  'lower devonian'        : [229, 172, 77],

  pridoli                 : [230, 245, 225],
  ludlow                  : [191, 230, 207],
  wenlock                 : [179, 225, 194],
  llandovery              : [153, 215, 179],

  'upper ordovician'      : [127, 202, 147],
  'middle ordovician'     : [ 77, 180, 126],
  'lower ordovician'      : [ 26, 157, 111],
  furongian               : [179, 224, 149],
  'cambrian series 3'     : [166, 207, 134],
  'cambrian series 2'     : [153, 192, 120],
  terreneuvian            : [140, 176, 108],
  'upper pleistocene'     : [255, 242, 211],
  ionian                  : [255, 242, 199],
  calabrian               : [255, 242, 186],
  gelasian                : [255, 237, 179], 
  piacenzian              : [255, 255, 191],
  zanclean                : [255, 255, 179],

  messinian               : [255, 255, 115],
  tortonian               : [255, 255, 102],
  serravallian            : [255, 255,  89],
  langhian                : [255, 255,  77],
  burdigalian             : [255, 255,  65],
  aquitanian              : [255, 255,  51],

  chattian                : [254, 230, 170],
  rupelian                : [254, 217, 154],

  priabonian              : [253, 205, 161],
  bartonian               : [253, 192, 145],
  lutetian                : [252, 180, 130],
  ypresian                : [252, 167, 115],

  thanetian               : [253, 191, 111],
  selandian               : [254, 191, 101],
  danian                  : [253, 180,  98],

  maastrichtian           : [242, 250, 140],
  campanian               : [230, 244, 127],
  santonian               : [217, 237, 116],
  coniacian               : [204, 233, 104],
  turonian                : [191, 227, 93],
  cenomanian              : [179, 222, 83],

  albian                  : [204, 234, 151],
  aptian                  : [191, 228, 138],
  barremian               : [179, 223, 127],
  hauterivian             : [166, 217, 117],
  valanginian             : [153, 211, 106],
  berriasian              : [140, 205, 96],

  tithonian               : [217, 241, 247],
  kimmeridgian            : [204, 236, 244],
  oxfordian               : [191, 231, 241],

  callovian               : [191, 231, 229],
  bathonian               : [179, 226, 227],
  bajocian                : [166, 221, 224],
  aalenian                : [154, 217, 221],

  toarcian                : [153, 206, 227],
  pliensbachian           : [128, 197, 221],
  sinemurian              : [103, 188, 216],
  hettangian              : [ 78, 179, 211],

  rhaetian                : [227, 185, 219],
  norian                  : [214, 170, 211],
  carnian                 : [201, 155, 203],

  ladinian                : [201, 131, 191],
  anisian                 : [188, 117, 183],

  olenekian               : [176,  81, 165],
  induan                  : [164,  70, 159],

  changhsingian           : [252, 192, 178],
  wuchiaphingian          : [252, 180, 162],

  capitanian              : [251, 154, 133],
  wordian                 : [251, 141, 118],
  roadian                 : [251, 128, 105],

  kungurian               : [227, 135, 118],
  artinskian              : [227, 135, 104],
  sakmarian               : [227, 111, 92],
  asselian                : [227, 99, 80],

  gzhelian                : [204, 212, 199],
  kasimovian              : [191, 208, 197],
  moscovian               : [199, 203, 185],
  bashkirian              : [153, 194, 181],

  serpukhovian            : [191, 194, 107],
  visean                  : [166, 185, 108],
  tournaisian             : [140, 176, 108],

  famennian               : [242, 237, 197],
  frasnian                : [242, 237, 173],

  givetian                : [241, 225, 133],
  eifelian                : [241, 213, 118],

  emsian                  : [229, 208, 117],
  pragian                 : [229, 196, 104],
  lochkovian              : [229, 183,  90],

  ludfordian              : [217, 240, 223],
  gorstian                : [204, 236, 221],

  homerian                : [204, 235, 209],
  sheinwoodian            : [191, 230, 195],

  telychian               : [191, 230, 207],
  aeronian                : [179, 225, 194],
  rhuddanian              : [166, 220, 181],

  hirnantian              : [166, 219, 171],
  katian                  : [153, 214, 159],
  sandbian                : [140, 208, 148],

  darriwilian             : [116, 198, 156],
  dapingian               : [102, 192, 146],

  floian                  : [ 65, 176, 135],
  tremadocian             : [ 51, 169, 126],

  'cambrian stage 10'     : [230, 245, 201],
  'cambrian stage 9'      : [217, 240, 187],
  paibian                 : [204, 235, 174],

  guzhangian              : [204, 223, 170],
  drumian                 : [191, 217, 157],
  'cambrian stage 5'      : [179, 212, 146],

  'cambrian stage 4'      : [179, 202, 142],
  'cambrian stage 3'      : [166, 197, 131],

  'cambrian stage 2'      : [166, 186, 128],
  fortunian               : [153, 181, 117]
};
