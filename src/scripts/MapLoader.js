const THREE = require("three")
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
// import Stats from 'three/examples/jsm/libs/stats.module.js';



class MapLoader {
    static get highColor() {
        return {
            red: 246,
            green: 15,
            blue: 15
        }
    };
    static get mediumColor() {
        return {
            red: 236,
            green: 172,
            blue: 70
        };
    };
    static get lowColor() {
        return {
            red: 95,
            green: 251,
            blue: 181
        };
    };

    static get abbreviationToState() {
        return { "AL": "Alabama", "AK": "Alaska", "AS": "American Samoa", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District Of Columbia", "FM": "Federated States Of Micronesia", "FL": "Florida", "GA": "Georgia", "GU": "Guam", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MH": "Marshall Islands", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "MP": "Northern Mariana Islands", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PW": "Palau", "PA": "Pennsylvania", "PR": "Puerto Rico", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VI": "Virgin Islands", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming" };
    };

    static statsIndex() {
        return {
            Population: 0,
            Murder: 1,
            Rape: 2,
            Robbery: 3,
            Aggravated: 4,
            Burglary: 5,
            Larceny: 6,
            Motor: 7,
            Arson: 8
        }
    }

    static statsString() {
        return ["Population", "Murder and Nonnegligent Manslaughter", "Rape", "Robbery", "Aggravated Assault", "Burglary", "Larceny-theft", "Motor Vehicle Theft", "Arson"];
    }





    constructor(canvas, svgName, countyInfo) {
        this.crimeInfo = require("../assets/2018.json");

        // check statsIndex for more
        this.controlParams = {
            year: 2018,
            threeD: true,
            0: false,
            1: true,
            2: true,
            3: true,
            4: true,
            5: true,
            6: true,
            7: true,
            8: true
        };
        this.lastViewedYear = 2018;
        this.statePopulation = {};
        this.statePopulation["year"] = -1;
        this.stateToID = {};
        this.stateToID["NONE"] = [];

        // setup canvas and renderer
        this.canvas = canvas;
        const renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x050d1a, 1);
        const scene = new THREE.Scene();

        // for rander labels
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        document.body.appendChild(labelRenderer.domElement);

        // create camera
        const camera = new THREE.PerspectiveCamera(50, this.canvas.width / this.canvas.height, 1, 10000000);
        camera.position.x = 0
        camera.position.y = 0
        camera.position.z = 200
        scene.add(camera);

        // orbit control for mouse interactions
        const controls = new OrbitControls(camera, labelRenderer.domElement);
        controls.minDistance = 20;
        controls.update();


        // county group for all the counties collectively
        this.countyGroup = new THREE.Group();
        this.countyGroup.scale.multiplyScalar(0.25);
        this.countyGroup.position.x = -120;
        this.countyGroup.position.y = 80;
        this.countyGroup.scale.y *= - 1;

        // label group just because
        this.labelGroup = new THREE.Group();

        // extrude setting for creating mesh from 2d shape
        var extrudeSettings = {
            steps: 1,
            depth: 150,
            bevelEnabled: false,
        };

        // load map svg
        var svgLoader = new SVGLoader();
        let me = this;
        svgLoader.load(
            svgName,
            function (data) {
                const paths = data.paths;
                for (let i = 0; i < paths.length; i++) {
                    const crimeColor = MapLoader.colorGradient(0.00001, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor);
                    const path = paths[i];
                    const material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color(crimeColor),
                    });

                    const shapes = SVGLoader.createShapes(path);
                    const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
                    // geometry.computeBoundsTree();

                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.scale.z = 0.00001;
                    mesh.county = countyInfo[i][1];
                    mesh.state = countyInfo[i][0];
                    mesh.stats = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
                    mesh.rate = 0.0;
                    me.reset(mesh, true);
                    me.countyGroup.add(mesh);
                    // console.log(me.stateToID);
                    if (!(mesh.state in me.stateToID)) {
                        // console.log(me.stateToID);
                        me.stateToID[mesh.state] = [];
                    }
                    me.stateToID[mesh.state].push(mesh.id);

                    // const wireframe = new THREE.WireframeGeometry(geometry);
                    // const line = new THREE.LineSegments(wireframe);
                    // line.material.depthTest = false;
                    // line.material.opacity = 0.25;
                    // line.material.transparent = true;
                    // me.countyGroup.add(line);
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

        // delete the svg loader now
        svgLoader = null;

        // add the group to the scene
        scene.add(this.countyGroup);
        scene.add(this.labelGroup)

        // for raycasting
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector3(1, 1, 0.5);
        var mouseMoved = false;
        document.addEventListener('mousemove', function (event) {
            event.preventDefault();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            mouseMoved = true;
        });

        // div element that we will use for label
        const labelDiv = document.createElement('h4');
        labelDiv.setAttribute('style', 'white-space: pre; border: 5px; background-color: rgba(244, 180, 26, 0.8); color: #143D59; padding: 8px');
        labelDiv.className = 'label';
        var countyLabel = new CSS2DObject(labelDiv);
        const countyLabelID = countyLabel.id;
        scene.add(countyLabel);

        // prepare for animation
        this.step = 0; // for smooth transition, value range should be from 0 to 20

        // for gui control
        this.createGUI();
        this.lastIntersected = -1; // what we are intersecting now
        this.lastIntersectedState = "NONE";
        this.previousIntersected = -1; // what the previous intersection is
        this.previousIntersectedState = "NONE";

        // window resize
        window.addEventListener('resize', function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            labelRenderer.setSize(window.innerWidth, window.innerHeight);
            controls.update();
        });

        function UnprojectMouse() {
            var mouseVector = mouse;
            mouseVector.unproject(camera);
            const dir = mouseVector.sub(camera.position).normalize();
            const distance = - camera.position.z / dir.z;
            const pos = camera.position.clone().add(dir.multiplyScalar(distance));
            return pos
        }

        function CreateLabelDiv(obj) {
            me.previousIntersected = me.lastIntersected;
            me.previousIntersectedState = me.lastIntersectedState == obj.state ? "NONE" : me.lastIntersectedState;
            me.lastIntersected = obj.id;
            me.lastIntersectedState = obj.state;
            labelDiv.textContent = "Year: " + me.controlParams["year"];
            labelDiv.textContent += "\r\nCounty Name: " + obj.county;
            labelDiv.textContent += "\r\nState: " + MapLoader.abbreviationToState[obj.state];
            labelDiv.textContent += "\r\nPopulation: " + (obj.stats[0] != -1 ? obj.stats[0] : "Not Reported");
            if (me.controlParams[0]) {
                labelDiv.textContent += "\r\nState Population Density: " + (obj.stats[0] != -1 ? (obj.rate * 10 * 100).toFixed(2) + "%" : "Not Reported")
            }
            for (var j = 1; j < 9; j++) {
                if (me.controlParams[j]) {
                    labelDiv.textContent += "\r\n" + (MapLoader.statsString()[j]) + ": " + (obj.stats[j] != -1 ? obj.stats[j] : "Not Reported");
                }
            }
            labelDiv.textContent += "\r\nCumulated Rate: " + (obj.rate * 100).toFixed(2) + "%";
            const hw = MapLoader.getHeight(labelDiv);
            labelDiv.style.marginTop = -(hw.h / 2 + 5) + "px";
            labelDiv.style.marginLeft = (hw.w / 2 + 5) + "px";
        }

        this.animate = function () {
            requestAnimationFrame(me.animate);
            controls.update();

            // only do raycasting when mouse moved
            if (mouseMoved) {
                raycaster.setFromCamera(mouse, camera);
                const intersections = raycaster.intersectObjects(me.countyGroup.children);
                if (intersections.length == 0) {
                    me.previousIntersected = me.lastIntersected;
                    me.previousIntersectedState = me.lastIntersectedState;
                    me.lastIntersected = -1;
                    me.lastIntersectedState = "NONE";
                    scene.getObjectById(countyLabelID, true).visible = false;
                }
                for (var i = 0; i < intersections.length; i++) {
                    if (intersections[i].object.isMesh) {
                        scene.getObjectById(countyLabelID, true).visible = true;
                        if (intersections[i].object.id != me.lastIntersected) {
                            // change the label content
                            CreateLabelDiv(intersections[i].object)
                        }

                        countyLabel = new CSS2DObject(labelDiv);
                        // make the label follow mouse
                        scene.getObjectById(countyLabelID, true).position.copy(UnprojectMouse());
                        break;
                    }
                }
                mouseMoved = false;
                labelRenderer.render(scene, camera);
            }
            me.changeHeightAndColor();
            renderer.render(scene, camera);
        };

        this.animate();
    }

    // initiate the height change by assigning heights to each bar
    initiateHeightChange(fileChange) {
        let me = this;
        if (this.controlParams[0]) {
            this.calculatePopulationForState();
        }
        this.countyGroup.traverse(function (child) {
            if (child.isMesh) {
                me.reset(child, fileChange)
            }
        });
        this.step = 0;
    }

    // to change the color and height of the bar, note there is a step size of 20 to reach the final height just for smooth transition
    changeHeightAndColor() {
        const pi20 = Math.PI / 20;
        let me = this;
        this.countyGroup.traverse(function (child) {
            if (child.isMesh && (child.targetHeight - child.scale.z) / child.deltaHeight >= 1) {
                child.scale.set(1, 1, Math.max(0.00001, child.scale.z + child.deltaHeight));
                const color = new THREE.Color(MapLoader.colorGradient(child.scale.z, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor));
                child.material.color = color;
            }
        });

        // change color of the current state
        for (const id of this.stateToID[this.lastIntersectedState]) {
            const obj = this.countyGroup.getObjectById(id);
            var color = new THREE.Color(MapLoader.colorGradient(obj.scale.z, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor));
            const factor = Math.sin(pi20 * (me.step + 10));
            color.r = Math.min(1.0, color.r * (1 + factor / 3));
            color.g = Math.min(1.0, color.g * (1 + factor / 3));
            color.b = Math.min(1.0, color.b * (1 + factor / 3));
            obj.material.color = color;
        }

        // stop changing color of the last state
        for (const id of this.stateToID[this.previousIntersectedState]) {
            const obj = this.countyGroup.getObjectById(id);
            if (obj.isMesh) {
                const color = new THREE.Color(MapLoader.colorGradient(obj.scale.z, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor));
                obj.material.color = color;
            }
        }

        // highlight the current obj
        if (this.lastIntersected != -1) {
            const currentObj = this.countyGroup.getObjectById(this.lastIntersected);
            var color = new THREE.Color(MapLoader.colorGradient(currentObj.scale.z, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor));
            const factor = Math.sin(pi20 * (me.step));
            color.r = Math.min(1.0, color.r * (1 + factor / 2));
            color.g = Math.min(1.0, color.g * (1 + factor / 2));
            color.b = Math.min(1.0, color.b * (1 + factor / 2));
            currentObj.material.color = color;
        }


        // stop highlighting the previous obj
        if (this.previousIntersected != -1) {
            const prevObj = this.countyGroup.getObjectById(this.previousIntersected);
            this.previousIntersected = -1;
            const color = new THREE.Color(MapLoader.colorGradient(prevObj.scale.z, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor));
            prevObj.material.color = color;
        }

        this.step += 1;
        this.previousIntersectedState = "NONE";
    }

    static colorGradient(fadeFraction, rgbColor1, rgbColor2, rgbColor3) {
        if (fadeFraction > 1.0) {
            // console.log(fadeFraction)
            fadeFraction = 1.0;
        } else if (fadeFraction < 0) {
            fadeFraction = 0.0;
        }
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

    createGUI() {
        let me = this;
        const gui = new GUI({ width: 550 });
        gui.add(this.controlParams, 'year', 2013, 2018).step(1).name("Year").onChange(function () { me.readYear(me.controlParams.year) });
        gui.add(this.controlParams, '0').name("Population Density").onChange(function () { me.initiateHeightChange(false) });
        const v_crime = gui.addFolder("Violent Crime");
        v_crime.add(this.controlParams, '1').name("Murder and Nonnegligent Manslaughter").onChange(function () { me.initiateHeightChange(false) });
        v_crime.add(this.controlParams, '2').name("Rape").onChange(function () { me.initiateHeightChange(false) });
        v_crime.add(this.controlParams, '3').name("Robbery").onChange(function () { me.initiateHeightChange(false) });
        v_crime.add(this.controlParams, '4').name("Aggravated Assault").onChange(function () { me.initiateHeightChange(false) });
        const p_crime = gui.addFolder("Property Crime");
        p_crime.add(this.controlParams, '5').name("Burglary").onChange(function () { me.initiateHeightChange(false) });
        p_crime.add(this.controlParams, '6').name("Larceny-theft",).onChange(function () { me.initiateHeightChange(false) });
        p_crime.add(this.controlParams, '7').name("Motor Vehicle Theft").onChange(function () { me.initiateHeightChange(false) });
        p_crime.add(this.controlParams, '8').name("Arson").onChange(function () { me.initiateHeightChange(false) });
        p_crime.open();
        v_crime.open();
    }

    readYear(year) {
        if (year != this.lastViewedYear) {
            this.lastViewedYear = year;
            this.crimeInfo = require("../assets/" + year + ".json");
            if (this.controlParams[0]) {
                this.calculatePopulationForState();
            } else {
                this.statePopulation = {}
            }

            this.initiateHeightChange(true);
        }
    }

    reset(mesh, fileChange) {
        if (fileChange) {
            mesh.stats = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
            mesh.targetHeight = 0.000001;
            mesh.deltaHeight = 0.0;
            if (mesh.state in this.crimeInfo && mesh.county in this.crimeInfo[mesh.state]) {
                const info = this.crimeInfo[mesh.state][mesh.county];
                for (var i = 0; i < 9; i++) {
                    mesh.stats[i] = info[i];
                }
            }
        }
        if (!this.controlParams[0]) {
            var count = 0;
            for (var i = 1; i < 9; i++) {
                if (this.controlParams[i]) {
                    if (mesh.stats[i] != -1) {
                        count += mesh.stats[i];
                    }
                }
            }
            mesh.rate = count * 1.0 / mesh.stats[0];
        } else {
            mesh.rate = mesh.stats[0] * 1.0 / this.statePopulation[mesh.state] / 10.0;
        }
        mesh.targetHeight = Math.max(0.00001, mesh.rate * 20.0); // how high it should be, from 0 to 1
        mesh.deltaHeight = mesh.rate - mesh.scale.z / 20.0; // the amount of change for smooth transition
    }

    calculatePopulationForState() {
        if (this.controlParams["year"] != this.statePopulation["year"]) {
            for (var st in this.crimeInfo) {
                var pop = 0;
                this.statePopulation[st] = 0;
                for (var ct in this.crimeInfo[st]) {
                    pop += this.crimeInfo[st][ct][0] != -1 ? this.crimeInfo[st][ct][0] : 0;
                }
                this.statePopulation[st] = pop;
            }
            this.statePopulation["year"] = this.controlParams["year"];
        }
    }

    static getHeight(element) {
        element.style.visibility = "hidden";
        document.body.appendChild(element);
        var height = element.offsetHeight + 0;
        var width = element.offsetWidth + 0;
        document.body.removeChild(element);
        element.style.visibility = "visible";

        return { h: height, w: width };
    }

}

export default MapLoader;