const THREE = require("three")
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';



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

    static brightestColor() {
        return new THREE.Color("rgb(255, 255, 255)")
    }

    static darkestColor() {
        return new THREE.Color("rgb(50, 50, 50)")
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
            showState: false,
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
        this.lastViewedYear = 2018; // auto load 2018
        this.statePopulation = {}; // to record the population total of each state
        this.statePopulation["year"] = -1; // idk why it was here but sure
        this.stateToID = {}; // record the id for each state
        this.stateToID["NONE"] = []; // place holder
        this.initialHeight = 150; // how high is the bar

        // setup canvas and renderer
        this.canvas = canvas;
        const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance", });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x050d1a, 1);
        const scene = new THREE.Scene();
        // var pickingRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        // var pixelBuffer = new Uint8Array(4);

        // for rander labels

        // create camera
        const camera = new THREE.PerspectiveCamera(50, this.canvas.width / this.canvas.height, 1, 10000000);
        camera.position.x = 0
        camera.position.y = 0
        camera.position.z = 200
        scene.add(camera);

        // orbit control for mouse interactions
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 20;
        controls.update();

        const stats = new Stats();
        document.getElementById('container').appendChild(stats.dom);


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
            depth: this.initialHeight,
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
                    mesh.bbox = new THREE.Box3();

                    me.reset(mesh, true);
                    me.countyGroup.add(mesh);

                    // compute bounding box
                    const bbox = new THREE.Box3().setFromObject(mesh);
                    mesh.bbox = bbox;
                    mesh.bbox.max.z = mesh.targetHeight * me.initialHeight;

                    // push the id for each state
                    if (!(mesh.state in me.stateToID)) {
                        me.stateToID[mesh.state] = [];
                    }
                    me.stateToID[mesh.state].push(mesh.id);
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

        // prepare for animation
        this.stopTraversing = false;

        // for gui control
        this.createGUI();
        this.lastIntersected = -1; // what we are intersecting now
        this.lastIntersectedState = "NONE";
        this.previousIntersected = -1; // what the previous intersection is
        this.previousIntersectedState = "NONE";


        // for raycasting
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(1, 1);
        const mouseReal = new THREE.Vector2(0, 0);

        // div element that we will use for label
        const labelDiv = document.createElement('h4');
        labelDiv.setAttribute('style', 'white-space: pre; border: 5px; background-color: rgba(244, 180, 26, 0.8); color: #143D59; padding: 8px; position: absolute');
        labelDiv.className = 'noselect';
        labelDiv.style.visibility = "hidden";
        document.body.appendChild(labelDiv);



        // window resize
        window.addEventListener('resize', function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            // controls.update();
        });


        function CheckIntersection(ray) {
            const usedRay = ray.ray;
            var hitDistance = 9999;
            var closestID = -1;

            me.countyGroup.traverse(function (child) {
                if (child.isMesh) {
                    // check bbox intersection
                    const bbox = child.bbox;
                    if (usedRay.intersectsBox(bbox)) {
                        const intersection = ray.intersectObject(child, true);
                        if (intersection.length > 0) {
                            if (intersection[0].distance < hitDistance) {
                                hitDistance = intersection[0].distance;
                                closestID = intersection[0].object.id;
                            }
                        }
                    }
                }

            })
            return closestID;
        }

        function CreateLabelDiv(obj) {
            me.previousIntersected = me.lastIntersected;
            me.lastIntersected = obj.id;
            if (me.controlParams.showState) {
                me.previousIntersectedState = me.lastIntersectedState == obj.state ? "NONE" : me.lastIntersectedState;
                me.lastIntersectedState = obj.state;
            } else {
                me.previousIntersectedState = "NONE";
                me.lastIntersectedState = "NONE";
            }
            labelDiv.textContent = obj.desc;
        }

        var mouseMoved = false;
        document.addEventListener('mousemove', function (event) {
            event.preventDefault();
            mouseReal.x = event.clientX;
            mouseReal.y = event.clientY;
            mouseMoved = true;
        });

        this.animate = function () {
            requestAnimationFrame(me.animate);
            stats.update();
            controls.update();
            if (mouseMoved) {
                mouse.x = (mouseReal.x / window.innerWidth) * 2 - 1;
                mouse.y = - (mouseReal.y / window.innerHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const intersectID = CheckIntersection(raycaster);
                if (intersectID == -1) {
                    me.previousIntersected = me.lastIntersected;
                    me.previousIntersectedState = me.lastIntersectedState;
                    me.lastIntersected = -1;
                    me.lastIntersectedState = "NONE";
                    labelDiv.style.visibility = "hidden";
                } else {
                    const obj = scene.getObjectById(intersectID);
                    if (obj.isMesh && intersectID != me.lastIntersected) {
                        CreateLabelDiv(obj);
                    }
                    labelDiv.style.visibility = "visible";
                    if (mouse.x >= 0) {
                        labelDiv.style.right = (window.innerWidth - mouseReal.x + 5) + 'px';
                        labelDiv.style.left = "";
                    } else {
                        labelDiv.style.right = ""
                        labelDiv.style.left = (mouseReal.x + 5) + "px";
                    }
                    labelDiv.style.top = (mouseReal.y + 5) + 'px';
                }
                mouseMoved = false;
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
        this.stopTraversing = false;
    }

    // to change the color and height of the bar, note there is a step size of 20 to reach the final height just for smooth transition
    changeHeightAndColor() {
        // const pi1000 = Math.PI / 1000;
        let me = this;
        var allClear = true;
        const date = new Date();
        const time = date.getTime() / 300;
        if (!this.stopTraversing) {
            this.countyGroup.traverse(function (child) {
                if (child.isMesh && (child.targetHeight - child.scale.z) / child.deltaHeight >= 1) {
                    child.scale.set(1, 1, Math.max(0.00001, child.scale.z + child.deltaHeight));
                    const color = new THREE.Color(MapLoader.colorGradient(child.scale.z, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor));
                    child.material.color = color;
                    allClear = false;
                }
            });
        }

        if (!this.stopTraversing && allClear && this.countyGroup.children.length > 0) {
            this.stopTraversing = true;
        }

        // change color of the current state
        for (const id of this.stateToID[this.lastIntersectedState]) {
            const currentObj = this.countyGroup.getObjectById(id);
            if (currentObj.targetColor == null) {
                currentObj.targetColor = new THREE.Color(MapLoader.colorGradient(currentObj.targetHeight, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor))
            }
            currentObj.material.color = new THREE.Color().lerpColors(currentObj.targetColor, MapLoader.darkestColor(), Math.sin(time) / 2 + 0.5);
        }

        // stop changing color of the last state
        for (const id of this.stateToID[this.previousIntersectedState]) {
            const currentObj = this.countyGroup.getObjectById(id);
            currentObj.targetColor = null;
            const color = new THREE.Color(MapLoader.colorGradient(currentObj.scale.z, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor));
            currentObj.material.color = color;
        }

        // highlight the current obj
        if (this.lastIntersected != -1) {
            const currentObj = this.countyGroup.getObjectById(this.lastIntersected);
            if (currentObj.targetColor == null) {
                currentObj.targetColor = new THREE.Color(MapLoader.colorGradient(currentObj.targetHeight, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor));
            }
            currentObj.material.color = new THREE.Color().lerpColors(currentObj.targetColor, MapLoader.brightestColor(), Math.sin(time) / 2 + 0.5);
        }


        // stop highlighting the previous obj
        if (this.previousIntersected != -1) {
            const prevObj = this.countyGroup.getObjectById(this.previousIntersected);
            this.previousIntersected = -1;
            const color = new THREE.Color(MapLoader.colorGradient(prevObj.scale.z, MapLoader.lowColor, MapLoader.mediumColor, MapLoader.highColor));
            prevObj.material.color = color;
            prevObj.targetColor = null;
        }


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
        gui.add(this.controlParams, 'showState').name("Highlight State").onChange();
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
            mesh.allTexts = ["Not Available", "Not Available", "Not Available", "Not Available", "Not Available", "Not Available", "Not Available", "Not Available", "Not Available"]
            mesh.targetHeight = 0.00001;
            mesh.deltaHeight = 0.0;
            if (mesh.state in this.crimeInfo && mesh.county in this.crimeInfo[mesh.state]) {
                const info = this.crimeInfo[mesh.state][mesh.county];
                for (var i = 0; i < 9; i++) {
                    mesh.stats[i] = info[i];
                }
            }
            mesh.baseTexts = "Year: " + this.controlParams["year"];
            mesh.baseTexts += "\r\nCounty Name: " + mesh.county;
            mesh.baseTexts += "\r\nState: " + MapLoader.abbreviationToState[mesh.state];
            mesh.baseTexts += "\r\nPopulation: " + (mesh.stats[0] != -1 ? mesh.stats[0] : "Not Available");
            mesh.targetColor = null;
            for (var j = 1; j < 9; j++) {
                if (this.controlParams[j]) {
                    mesh.allTexts[j] = "\r\n" + (MapLoader.statsString()[j]) + ": " + (mesh.stats[j] != -1 ? mesh.stats[j] : "Not Available");
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

        mesh.desc = mesh.baseTexts;
        for (var i = 1; i < 9; i++) {
            if (this.controlParams[i]) {
                mesh.desc += mesh.allTexts[i];
            }
        }
        if (!this.controlParams[0]) {
            mesh.desc += "\r\nCumulated Rate: " + (mesh.rate * 100).toFixed(2) + "%";
        } else {
            mesh.desc += "\r\nPopulation Density in State: " + (mesh.stats[0] != -1 ? (mesh.rate * 10 * 100).toFixed(2) + "%" : "Not Available");
        }


        mesh.targetHeight = Math.max(0.00001, mesh.rate * 20.0); // how high it should be, from 0 to 1
        mesh.deltaHeight = mesh.rate - mesh.scale.z / 20.0; // the amount of change for smooth transition
        mesh.bbox.max.z = mesh.targetHeight * this.initialHeight;
    }

    calculatePopulationForState() {
        if (this.controlParams["year"] != this.statePopulation["year"]) {
            for (const st in this.crimeInfo) {
                var pop = 0;
                this.statePopulation[st] = 0;
                for (const ct in this.crimeInfo[st]) {
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