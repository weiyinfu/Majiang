"use strict";
class Rectangle {
    area(s) {
        return s;
    }
}
let big;
big = function (s, ss) {
    return s + ss;
};
let small;
small = function (s) {
    return s;
};
// small=big; small=big会报错
big = small; //big=small不会报错
