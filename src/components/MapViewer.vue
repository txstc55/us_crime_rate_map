<template>
  <div>
    <div class="canvas-wrapper">
      <canvas class="canvas" ref="myCanvas" />
    </div>
  </div>
</template>

<script>
var canvasBgColor = { r: 0, g: 0, b: 0, a: 1 };
import MapLoader from "../scripts/MapLoader.js"
export default {
  name: "MatrixViewer",
  data() {
    return {
      canvas: null,
      canvasBgColor,
      ml: null,
    };
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
    // set the initial background color
    this.$refs.myCanvas.style.backgroundColor =
      "rgba(" +
      this.canvasBgColor.r +
      ", " +
      this.canvasBgColor.g +
      ", " +
      this.canvasBgColor.b +
      ", " +
      1 +
      ")";

    this.canvas = this.$refs.myCanvas;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ml = new MapLoader(this.canvas);
  },
};
</script>

<style>
div.selection-container {
  background-color: rgba(23, 27, 44, 0.3);
  max-width: 100vw;
  width: 100vw;
}

.control-label {
  width: 40%;
  float: top;
  display: table-row;
  font-size: 11px;
  color: #4fccc2;
  font-weight: bold;
  margin-bottom: -5px;
}

.label-text {
  color: #4fccc2;
  font-weight: bold;
  margin-top: -1px;
}

.label-name {
  float: left;
  text-align: left;
}

.label-value {
  display: block;
  float: right;
  text-align: right;
}

#text-area-label {
  width: 100%;
  float: top;
  display: table-row;
  font-size: 12px;
  color: #4fccc2;
  font-weight: bold;
  float: left;
  text-align: left;
}

.v-btn__content {
  width: 100%;
  white-space: normal;
}

.output-button .v-btn__content {
  color: #182750;
}
∂ .abort-button .v-btn__content {
  color: #ffffff;
  font-weight: bold;
}

.output-button .v-btn--disabled.v-btn__content {
  color: #b9e4a6;
}

.canvas-wrapper {
  overflow: auto;
  /* max-height: 100%;
  height: 100%;
  max-width: 100%; */
  position: relative;
  text-align: center;
}

#myCanvas {
  padding-left: 0;
  padding-right: 0;
  margin-left: auto;
  margin-right: auto;
  display: inline-block;
}
</style>
