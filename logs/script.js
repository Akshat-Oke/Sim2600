//or using ES6
const dfd = require("danfojs-node")

/**@type number[][] */
const norGates = []
//Map with number[][] as values
const gates3Inputs = {
  "OR": [],
  "NAND": [],
  "AND": [],
  "NOR": [],
  "XNOR": [],
  "XOR": []
}

async function f() {
  const df = await dfd.readCSV("./wire.csv")
  console.log(df.shape)
  df.drop({ index: [0], inplace: true })
  console.log(df.shape)
  const varDf = df.sum({ axis: 0 })
  console.log(varDf.iat(5))
  varDf.head().print()
  const cols = df.shape[1]
  console.log("Columns = ", cols)
  const wiresToCheck = []
  const rows = df.shape[0]

  for (let i = 0; i < cols; i++) {
    if (varDf.iat(i) < 2 || rows - varDf.iat(i) < 2) {
      // const colname = df.columns[i]
      // console.log("Dropping column name:", df.columns[i], "with variance:", varDf.iat(i))
      // df.drop({ columns: [colname], inplace: true })
    } else {
      wiresToCheck.push(i)
    }
  }
  //for every pair of wires, check if third wire
  //has definite outputs for the same values of the first two wires
  // const dfArr = Array.from(df);
  identifyGates(wiresToCheck, rows, df)
  //iterate over keys of gates3inputs
  for (const key in gates3Inputs) {
    console.log(key, gates3Inputs[key].length)
  }
}
f()

const outputWires = []

function identifyGates(wiresToCheck, rows, df) {
  const wiresToCheckLength = Math.min(wiresToCheck.length, 150)
  for (let i = 0; i < wiresToCheckLength; i++) {
    for (let j = i + 1; j < wiresToCheckLength; j++) {

      for (let out = 0; out < wiresToCheckLength; out++) {
        if (out == i || out == j)
          continue
        const map = {}
        let canBeAGate = true
        for (let row = 0; row < rows; row++) {
          const wire1 = df.iat(row, wiresToCheck[i])
          const wire2 = df.iat(row, wiresToCheck[j])
          const key = wire1 + " " + wire2
          if (map[key]) {
            if (map[key] != df.iat(row, wiresToCheck[out])) {
              canBeAGate = false
              break
            }
          } else {
            map[key] = df.iat(row, wiresToCheck[out])
          }
        }
        //check if map has 4 keys
        if (canBeAGate) {
          const gateType = getGateType(map)
          if (gateType) {
            // console.log("Wires ", wiresToCheck[i], wiresToCheck[j], wiresToCheck[out], " can be a ", gateType, " gate")
            gates3Inputs[gateType].push([wiresToCheck[i], wiresToCheck[j], wiresToCheck[out]])
          }
        }
      }
    }
  }
}

function getGateType(map) {
  if (Object.keys(map).length == 4) {
    const gates = { "0,1,1,1": "OR", "1,0,0,0": "NAND", "0,0,0,1": "AND", "1,1,1,0": "NOR", "1,0,0,1": "XNOR", "0,1,1,0": "XOR" }
    // const key = map["0,0"] + "," + map["0,1"] + "," + map["1,0"] + "," + map["1,1"]
    //Above but elegant
    const key = Object.values(map).join(",")
    return gates[key];
  } else {
    return null;
  }
}

var pulledWires = [0, 3, 4, 5, 6, 8, 10, 11, 14, 16, 17, 19, 20, 21, 22, 23, 25, 26, 27, 29, 31, 33, 34, 35, 36, 38, 39, 46, 53, 58, 60, 61, 62, 63, 65, 67, 70, 71, 72, 75, 76, 77, 78, 79, 80, 83, 84, 89, 90, 91, 93, 97, 104, 105, 108, 109, 110, 111, 113, 117, 118, 120, 122, 123, 124, 125, 127, 128, 130, 131, 132, 133, 134, 139, 141, 142, 143, 145, 146, 149, 152, 154, 155, 156, 157, 160, 161, 163, 167, 168, 169, 172, 174, 176, 177, 178, 179, 180, 182, 184, 187, 188, 191, 192, 193, 194, 196, 198, 200, 201, 204, 206, 207, 208, 209, 212, 213, 216, 217, 218, 219, 220, 221, 224, 225, 227, 228, 229, 231, 232, 233, 234, 236, 238, 240, 241, 242, 243, 244, 245, 249, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 267, 269, 270, 271, 272, 273, 274, 275, 278, 279, 280, 281, 282, 284, 285, 286, 287, 288, 291, 293, 295, 297, 299, 300, 301, 302, 303, 306, 307, 308, 309, 311, 312, 314, 317, 318, 319, 320, 321, 324, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 340, 341, 342, 344, 345, 347, 350, 351, 352, 354, 355, 358, 365, 366, 368, 370, 371, 372, 374, 376, 378, 379, 382, 383, 384, 385, 386, 388, 389, 390, 391, 392, 396, 397, 400, 401, 403, 404, 409, 410, 412, 419, 420, 422, 423, 424, 425, 427, 428, 432, 434, 436, 439, 440, 441, 442, 444, 445, 446, 447, 450, 453, 457, 458, 461, 462, 464, 465, 466, 467, 468, 470, 472, 473, 474, 476, 477, 478, 479, 480, 481, 484, 485, 486, 487, 488, 489, 490, 491, 492, 494, 496, 499, 500, 501, 503, 504, 505, 506, 507, 510, 513, 515, 516, 517, 518, 519, 522, 523, 525, 528, 531, 532, 533, 535, 538, 540, 543, 544, 546, 548, 550, 551, 552, 553, 555, 556, 564, 565, 566, 567, 568, 570, 571, 572, 575, 578, 579, 582, 583, 586, 587, 588, 592, 593, 594, 595, 600, 602, 603, 604, 606, 607, 608, 609, 611, 613, 616, 617, 618, 620, 623, 624, 625, 626, 628, 629, 630, 631, 632, 636, 637, 638, 640, 641, 645, 646, 647, 649, 651, 652, 658, 660, 662, 664, 665, 667, 669, 670, 673, 674, 677, 678, 679, 681, 682, 686, 687, 689, 690, 691, 692, 693, 694, 695, 696, 699, 700, 701, 702, 708, 709, 712, 713, 714, 715, 717, 718, 720, 721, 723, 725, 726, 728, 730, 731, 732,
  733, 735, 739, 743, 744, 746, 747, 748, 750, 753, 754, 755, 757, 761, 762, 763, 764, 765, 767, 769, 770, 771, 772, 773, 774, 775, 776, 778, 779, 781, 782, 783, 784, 786, 787, 788, 789, 790, 791, 795, 797, 800, 803, 804, 807, 808, 809, 810, 811, 812, 813, 815, 817, 818, 819, 822, 824, 827, 830, 831, 834, 837, 838, 839, 840, 841, 842, 844, 845, 846, 847, 849, 850, 851, 852, 853, 854, 857, 860, 861, 862, 867, 870, 871, 872, 875, 876, 877, 879, 880, 882, 883, 884, 885, 888, 889, 890, 895, 896, 901, 904, 905, 906, 909, 910, 913, 916, 917, 918, 919, 920, 923, 925, 926, 928, 929, 930, 931, 932, 933, 934, 935, 936, 937, 938, 944, 946, 947, 950, 951, 952, 953, 954, 956, 958, 959, 961, 962, 964, 965, 966, 967, 969, 971, 973, 975, 976, 979, 980, 981, 983, 985, 986, 987, 988, 990, 992, 995, 996, 997, 998, 1002, 1003, 1006, 1007, 1009, 1010, 1016, 1017, 1018, 1019, 1021, 1023, 1024, 1025, 1026, 1028, 1031, 1032, 1033, 1034, 1035, 1037, 1038, 1039, 1042, 1043, 1044, 1045, 1046, 1047, 1048, 1050, 1052, 1054, 1055, 1056, 1057, 1063, 1065, 1066, 1067, 1069, 1070, 1073, 1074, 1075, 1077, 1079, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1088, 1089, 1090, 1091, 1093, 1094, 1096, 1097, 1099, 1101, 1106, 1107, 1109, 1110, 1111, 1112, 1114, 1115, 1116, 1117, 1119, 1120, 1122, 1125, 1129, 1130, 1133, 1134, 1135, 1137, 1138, 1141, 1143, 1144, 1145, 1146, 1153, 1154, 1155, 1157, 1159, 1164, 1165, 1166, 1168, 1169, 1170, 1173, 1174, 1175, 1178, 1179, 1180, 1181, 1182, 1184, 1185, 1187, 1190, 1192, 1193, 1194, 1195, 1196, 1197, 1199, 1200, 1202, 1204, 1205, 1206, 1209, 1210, 1211, 1213, 1214, 1215, 1217, 1218, 1219, 1220, 1222, 1223, 1224, 1225, 1226, 1227, 1228, 1229, 1230, 1231, 1232, 1233, 1236, 1238, 1239, 1240, 1241, 1243, 1244, 1245, 1246, 1250, 1251, 1253, 1255, 1256, 1257, 1258, 1259, 1260, 1262, 1265, 1267, 1268, 1270, 1271, 1273, 1275, 1277, 1281, 1285, 1286, 1289, 1290, 1292, 1293, 1294, 1295, 1301, 1303, 1304, 1305, 1306, 1308, 1309, 1311, 1312, 1313, 1314, 1315, 1316, 1318, 1319, 1320, 1323, 1324, 1327, 1328, 1329, 1334, 1335, 1337, 1339, 1342, 1343, 1344, 1345, 1346, 1347, 1350, 1352, 1355, 1356, 1357, 1358, 1364, 1368, 1369, 1370, 1371, 1372, 1374, 1375, 1376, 1377, 1379, 1380, 1381, 1382, 1383, 1384, 1385, 1386, 1389, 1391, 1392, 1394, 1396, 1398, 1399, 1400, 1401, 1402, 1408, 1410, 1412, 1413, 1414, 1415, 1416, 1419, 1420, 1421, 1423,
  1425, 1427, 1428, 1429, 1430, 1433, 1434, 1439, 1440, 1441, 1444, 1446, 1448, 1449, 1453, 1455, 1457, 1458, 1459, 1460, 1462, 1463, 1464, 1465, 1466, 1469, 1471, 1474, 1475, 1476, 1478, 1481, 1482, 1484, 1486, 1487, 1488, 1491, 1492, 1494, 1495, 1496, 1497, 1499, 1500, 1502, 1504, 1506, 1507, 1511, 1512, 1517, 1518, 1519, 1520, 1521, 1523, 1524, 1525, 1526, 1531, 1534, 1540, 1541, 1542, 1543, 1544, 1548, 1549, 1552, 1557, 1560, 1561, 1562, 1566, 1567, 1569, 1571, 1573, 1575, 1576, 1578, 1580, 1582, 1585, 1586, 1587, 1588, 1589, 1592, 1593, 1594, 1595, 1596, 1597, 1599, 1600, 1601, 1605, 1610, 1612, 1613, 1614, 1618, 1619, 1621, 1622, 1623, 1626, 1628, 1629, 1631, 1632, 1634, 1635, 1637, 1638, 1640, 1641, 1642, 1643, 1646, 1647, 1649, 1650, 1654, 1655, 1657, 1658, 1660, 1662, 1664, 1665, 1668, 1671, 1672, 1676, 1677, 1682, 1684, 1687, 1688, 1689, 1691, 1694, 1697, 1704, 1705, 1708, 1709, 1710, 1711, 1712, 1714, 1715, 1716, 1717, 1718, 1719, 1720, 1721, 1722, 1724]