<template>
  <div>
    <div id="container"></div>
    <div class="canvas-wrapper">
      <canvas class="canvas" ref="myCanvas" />
      <div id="menuInfo">
        <div id="menuInfoWrapper" class="menuWrapper">
          <div id="menuInfoFormDiv">
            <div id="menuInfoForm1" class="menuForm noselect">
              DISCLAIMER:<br />
              Every piece of data found here is available online.<br />
              Mostly from FBI website, which doesn't contain<br />
              all the crime stats from every state.<br />
              The map shown here is by no means for any ranking<br /><br />
              There is a scaling factor for the height,<br />
              which is different for population density and crime rate<br />
              The scaling factor is there so the map won't be too flat<br /><br />
              Move your mouse around while holding<br />
              left click or right click to move the map<br /><br />
              Found a bug?<br />
              Contact me @ txstc55[at]gmail[dot]com<br />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
var canvasBgColor = { r: 196, g: 238, b: 142, a: 1 };
import MapLoader from "../scripts/MapLoader.js";
const countyOrder = require("../assets/countyOrder.json");
export default {
  name: "MatrixViewer",
  data() {
    return {
      canvas: null,
      canvasBgColor,
      ml: null,
    };
  },

  methods: {
  },

  mounted() {
    // for safari
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("safari") != -1) {
      if (ua.indexOf("chrome") <= -1) {
        const inputs = document.querySelectorAll(".v-file-input input");
        [...inputs].forEach((input) => {
          input.remove();
        });
      }
    }

    this.canvas = this.$refs.myCanvas;

    this.ml = new MapLoader(
      this.canvas,
      "Usa_counties_large.svg",
      countyOrder["order"]
    );
  },
};
</script>

<style>
.dg{
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}
.dg.main.taller-than-window .close-button {
  border-top: 1px solid rgb(144, 42, 42);
}

canvas {
  position: absolute;
}

.dg.main .close-button {
  background-color: #2b3252;
  color: #fad744;
  font-weight: bold;
}

.dg.main .close-button:hover {
  background-color: #fad744;
  color: #2b3252;
  font-weight: bold;
}

.dg {
  color: #fad744;
  text-shadow: none !important;
}

.dg.main::-webkit-scrollbar {
  background: #fafafa;
}

.dg.main::-webkit-scrollbar-thumb {
  background: #bbb;
}

.dg li:not(.folder) {
  background: #2b3252;
  border-bottom: 1px solid rgb(47, 104, 126);
}

.dg li.save-row .button {
  text-shadow: none !important;
}

.dg li.title {
  background: #2b3252 6px 10px no-repeat;
  color: #fad744;
  font-weight: bold;
  font-size: 15px;
}

.dg .cr.boolean {
  background: #2d4157;
  color: #fad744;
  font-size: 12px;
  white-space: nowrap;
  /* position: absolute; */
}

.dg .cr.function:hover,
.dg .cr.boolean:hover {
  background: rgb(134, 35, 88);
}

.dg .cr.number input[type="text"] {
  color: #fad744;
  /* text-align: center; */
}

.dg .c input[type="text"] {
  background: #354f81;
  font-size: 13px;
  color: #fad744;
  text-align: center;
  padding-top: -20px;
}

.dg .c input[type="text"]:hover {
  background: #2e4570;
}

.dg .c input[type="text"]:focus {
  background: rgb(34, 30, 90);
  color: #fad744;
}

.dg .c input[type="checkbox"] {
  float: right;
  /* display: inline-block */
}

.dg .c .slider {
  background: #e9e9e9;
}

.dg .c .slider-fg {
  background: #68ecd6;
}

.dg .c {
}

.dg .c .slider:hover {
  background: #eee;
}

/* removes the top and left whitespace */
* {
  margin: 0;
  padding: 0;
}

/* ensure full screen */
html,
body {
  width: 100%;
  height: 100%;
  font-family: "Courier New", Courier, monospace;
  font-size: 95%;
}

#menuCtrl {
  position: absolute;
  margin: 5px;
}

#menuInfo {
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 5px;
}

.menuWrapper {
}

.menuForm {
  float: left;
  margin-top: 22px;
  padding: 5px;
  background-color: rgba(54, 69, 110, 0.657);
  border: 2px solid black;
  border-radius: 10px;
  border-top-left-radius: 0;
  box-shadow: 3px 3px 5px #333;
  color: #F4af1b;
  font-weight: bold
}

.menuForm table {
  padding-top: 3px;
}
.menuForm td,
th {
  white-space: nowrap;
}
.menuForm th {
  text-align: left;
}

.menuTabs {
  position: absolute;
  white-space: nowrap;
  top: 0;
}

.menuTabs div.tab {
  float: left;
  height: 20px;
  min-width: 20px;
  margin: 0;
  padding: 0 5px 0 5px;
  text-align: center;
  background-color: white;
  border: 2px solid black;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}
.menuTabs div.secondary {
  border-left: 0px;
}
.menuTabs div.active {
  opacity: 1;
  border-bottom: 2px solid white;
}
.menuTabs div.active.showHide {
  border-bottom: 2px solid black;
}
.menuTabs div.inActive {
  opacity: 0.75;
  border-bottom: 2px solid black;
}

.hidden {
  display: none;
}
#menuInfoWrapper.hidden {
  display: block;
}
#menuInfoWrapper.hidden #menuInfoTabs {
  top: auto;
  bottom: 0;
  right: 0;
}

.noselect {
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}

</style>
