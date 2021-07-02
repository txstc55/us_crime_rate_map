const THREE = require("three")
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
class MapLoader {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true });
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.scene = new THREE.Scene();


        this.camera = new THREE.PerspectiveCamera(50, this.canvas.width / this.canvas.height, 1, 1000);
        this.camera.position.x = 0
        this.camera.position.y = 0
        this.camera.position.z = 200
        this.scene.add(this.camera);

        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.update();



        const svgLoader = new SVGLoader();
        this.countyGroup = new THREE.Group();
        let me = this;
        const highColor = {
            red: 255,
            green: 19,
            blue: 80
        };
        const mediumColor = {
            red: 147,
            green: 78,
            blue: 178
        };
        const lowColor = {
            red: 148,
            green: 215,
            blue: 252
        };

        this.countyShapes = [];

        var extrudeSettings = {
            steps: 1,
            depth: 5,
            bevelEnabled: false,
        };

        svgLoader.load(
            './Usa_counties_large.svg',
            function (data) {
                // console.log(data);
                const paths = data.paths;
                // console.log(paths);
                me.countyGroup.scale.multiplyScalar(0.25);
                me.countyGroup.position.x = -120;
                me.countyGroup.position.y = 80;
                me.countyGroup.scale.y *= - 1;

                for (let i = 0; i < paths.length; i++) {
                    const crimeColor = me.colorGradient(0.0, lowColor, mediumColor, highColor);
                    const path = paths[i];
                    const material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color(crimeColor),
                    });

                    const shapes = SVGLoader.createShapes(path);
                    me.countyShapes.push(shapes);
                    extrudeSettings.depth = 100;
                    const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.id2 = i;
                    mesh.changeFactor = 0.0;
                    mesh.scale.z = 0.0;
                    me.countyGroup.add(mesh);
                }
            },
            // called when loading is in progresses
            function (xhr) {
                // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // called when loading has errors
            function (error) {
                console.log(error)
                console.log('An error happened');

            }
        )

        this.scene.add(this.countyGroup);
        // console.log(this.countyGroup);
        var c = 0;
        this.animate = function () {
            requestAnimationFrame(me.animate);
            controls.update();
            me.renderer.render(me.scene, me.camera);
            // console.log( me.renderer.info.render.triangles );
            // console.log(123);
            if (c % 60 == 0) {
                c = 0;
                const r = Math.random() * 4527;
                me.countyGroup.traverse(function (child) {
                    if (child.isMesh) {
                        const randomNumber = (child.id2 * r % 100) / 100;
                        child.changeFactor = (randomNumber - child.scale.z) / 20.0;
                        // child.scale.set(1, 1, randomNumber);
                        child.material.color = new THREE.Color(me.colorGradient(child.scale.z, lowColor, mediumColor, highColor));
                    }
                })
            } else if (c % 60 <= 20) {
                me.countyGroup.traverse(function (child) {
                    if (child.isMesh) {
                        child.scale.set(1, 1, child.scale.z + child.changeFactor);
                        child.material.color = new THREE.Color(me.colorGradient(child.scale.z, lowColor, mediumColor, highColor));
                    }
                })
            }
            c += 1;
        };
        this.animate();

    }


    colorGradient(fadeFraction, rgbColor1, rgbColor2, rgbColor3) {
        var color1 = rgbColor1;
        var color2 = rgbColor2;
        var fade = fadeFraction;

        // Do we have 3 colors for the gradient? Need to adjust the params.
        if (rgbColor3) {
            fade = fade * 2;

            // Find which interval to use and adjust the fade percentage
            if (fade >= 1) {
                fade -= 1;
                color1 = rgbColor2;
                color2 = rgbColor3;
            }
        }

        var diffRed = color2.red - color1.red;
        var diffGreen = color2.green - color1.green;
        var diffBlue = color2.blue - color1.blue;

        var gradient = {
            red: parseInt(Math.floor(color1.red + (diffRed * fade)), 10),
            green: parseInt(Math.floor(color1.green + (diffGreen * fade)), 10),
            blue: parseInt(Math.floor(color1.blue + (diffBlue * fade)), 10),
        };

        return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
    }
}

export default MapLoader;