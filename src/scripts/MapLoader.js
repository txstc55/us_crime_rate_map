const THREE = require("three")
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const VS = `
void main(){
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition; 
}
`

const FS = `
vec3 lowColor = vec3(95.0/255.0, 251.0/255.0, 181.0/255.0);
vec3 mediumColor = vec3(236.0/255.0, 172.0/255.0, 70.0/255.0);
vec3 highColor = vec3(246.0/255.0, 15.0/255.0, 15.0/255.0);
vec3 bright = vec3(1.0, 1.0, 1.0);
vec3 dark = vec3(0.02, 0.08, 0.08);
uniform float height;
uniform float highlightFactor;

vec3 calculateColor(){
    float d = height * 2.0;
    vec3 result = vec3(0.0, 0.0, 0.0);
    if (d >= 1.0){
        result = mix(mediumColor, highColor, d - 1.0);
    } else{
        result = mix(lowColor, mediumColor, d);
    }
    return result;
}

vec3 highlight(){
    vec3 currentColor = calculateColor();
    if (highlightFactor != 0.0){
        if (highlightFactor > 0.0){
            return mix(currentColor, bright, highlightFactor);
        }else{
            return mix(currentColor, dark, -highlightFactor);
        }
    }
    return currentColor;
}


void main(){
    vec3 calculatedColor = highlight();
    gl_FragColor= vec4(calculatedColor, 0.0);
}
`



class MapLoader {

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
        this.stateGroups = {};
        for (const st in MapLoader.abbreviationToState) {
            const g = new THREE.Group();
            g.scale.multiplyScalar(0.25);
            g.position.x = -120;
            g.position.y = 80;
            g.scale.y *= - 1;
            this.stateGroups[st] = g;
        }
        this.stateGroups["NONE"] = new THREE.Group(); // place holder

        // setup canvas and renderer
        this.canvas = canvas;
        const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance", });
        if (window.innerWidth > 1920 || window.innerHeight > 1920) {
            renderer.setPixelRatio(window.devicePixelRatio * 0.66);
        } else {
            renderer.setPixelRatio(window.divicePixelRatio);
        }
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


        // extrude setting for creating mesh from 2d shape
        var extrudeSettings = {
            steps: 1,
            depth: this.initialHeight,
            bevelEnabled: false,
        };

        // load map svg
        var svgLoader = new SVGLoader();
        let me = this;

        const shaderMaterial = new THREE.ShaderMaterial({ uniforms: { "height": { value: 0.00001 }, "highlightFactor": { value: 0.0 } }, vertexShader: VS, fragmentShader: FS });

        svgLoader.load(
            svgName,
            function (data) {
                const paths = data.paths;
                for (let i = 0; i < paths.length; i++) {
                    const path = paths[i];

                    const shapes = SVGLoader.createShapes(path);
                    const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
                    // geometry.computeBoundsTree();

                    const mesh = new THREE.Mesh(geometry, shaderMaterial.clone());
                    mesh.scale.z = 0.00001;
                    mesh.county = countyInfo[i][1];
                    mesh.state = countyInfo[i][0];
                    mesh.stats = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
                    mesh.rate = 0.0;
                    mesh.bbox = new THREE.Box3();

                    me.reset(mesh, true);
                    me.stateGroups[mesh.state].add(mesh);

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
        for (const st in this.stateGroups) {
            scene.add(this.stateGroups[st]);
        }

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
            if (window.innerWidth > 1920 || window.innerHeight > 1920) {
                renderer.setPixelRatio(window.devicePixelRatio * 0.66);
            } else {
                renderer.setPixelRatio(window.divicePixelRatio);
            }
            renderer.setPixelRatio(window.devicePixelRatio * 0.66);
            renderer.setSize(window.innerWidth, window.innerHeight);
            console.log(window.innerWidth);
            // controls.update();
        });


        // check intersection by checking the bounding box
        function CheckIntersection(ray) {
            const usedRay = ray.ray;
            var hitDistance = 9999;
            var closestID = -1;
            var state = "NONE";

            for (const st in me.stateGroups) {
                me.stateGroups[st].traverse(function (child) {
                    if (child.isMesh) {
                        // check bbox intersection
                        const bbox = child.bbox;
                        if (usedRay.intersectsBox(bbox)) {
                            const intersection = ray.intersectObject(child, true);
                            if (intersection.length > 0) {
                                if (intersection[0].distance < hitDistance) {
                                    hitDistance = intersection[0].distance;
                                    closestID = intersection[0].object.id;
                                    state = st;
                                }
                            }
                        }
                    }
                })

            }
            return { "state": state, "id": closestID };
        }

        // create the label texts        
        function CreateLabelDiv(obj) {
            me.previousIntersected = me.lastIntersected;
            me.lastIntersected = obj.id;

            me.previousIntersectedState = me.lastIntersectedState == obj.state ? "NONE" : me.lastIntersectedState;
            me.lastIntersectedState = obj.state;

            labelDiv.textContent = obj.desc;
        }

        // when mouse move, we need to do ray intersection and update mouse position
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
                const intersectionResult = CheckIntersection(raycaster);
                if (intersectionResult["id"] == -1) {
                    me.previousIntersected = me.lastIntersected;
                    me.previousIntersectedState = me.lastIntersectedState;
                    me.lastIntersected = -1;
                    me.lastIntersectedState = "NONE";
                    labelDiv.style.visibility = "hidden";
                } else {
                    const obj = me.stateGroups[intersectionResult["state"]].getObjectById(intersectionResult["id"]);
                    if (obj.isMesh && intersectionResult["id"] != me.lastIntersected) {
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
        for (const st in this.stateGroups) {
            this.stateGroups[st].traverse(function (child) {
                if (child.isMesh) {
                    me.reset(child, fileChange)
                }
            });
            this.stopTraversing = false;
        }
    }

    // to change the color and height of the bar, note there is a step size of 20 to reach the final height just for smooth transition
    changeHeightAndColor() {
        // const pi1000 = Math.PI / 1000;
        let me = this;
        var allClear = true;
        const date = new Date();
        const time = date.getTime() / 300;
        const sinValue = Math.sin(time) * 0.66.0 + 0.5;
        var sceneChildrenCount = 0;
        if (!this.stopTraversing) {
            for (const st in this.stateGroups) {
                this.stateGroups[st].traverse(function (child) {
                    if (child.isMesh && (child.targetHeight - child.scale.z) / child.deltaHeight >= 1) {
                        child.scale.set(1, 1, Math.max(0.00001, child.scale.z + child.deltaHeight));
                        // console.log(child.material.uniforms);
                        child.material.uniforms.height.value = child.scale.z;
                        allClear = false;
                        sceneChildrenCount += 1;
                    }
                });
            }
        }

        if (!this.stopTraversing && allClear && sceneChildrenCount > 0) {
            this.stopTraversing = true;
        }

        if (me.controlParams.showState) {
            // change color of the current state
            this.stateGroups[this.lastIntersectedState].traverse(function (child) {
                if (child.isMesh) {
                    child.material.uniforms.highlightFactor.value = -(sinValue);
                }
            })
        }
        // stop changing color of the last state
        this.stateGroups[this.previousIntersectedState].traverse(function (child) {
            if (child.isMesh) {
                child.material.uniforms.highlightFactor.value = 0.0;
            }
        })

        // highlight the current obj
        if (this.lastIntersected != -1) {
            this.stateGroups[this.lastIntersectedState].getObjectById(this.lastIntersected).material.uniforms.highlightFactor.value = sinValue;
        }


        // stop highlighting the previous obj
        if (this.previousIntersected != -1) {
            if (this.previousIntersectedState == "NONE") {
                this.stateGroups[this.lastIntersectedState].getObjectById(this.previousIntersected).material.uniforms.highlightFactor.value = 0.0;
            } else {
                this.stateGroups[this.previousIntersectedState].getObjectById(this.previousIntersected).material.uniforms.highlightFactor.value = 0.0;
            }
            this.previousIntersected = -1;
        }


        this.previousIntersectedState = "NONE";
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
        mesh.deltaHeight = mesh.rate - mesh.scale.z * 0.660.0; // the amount of change for smooth transition
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