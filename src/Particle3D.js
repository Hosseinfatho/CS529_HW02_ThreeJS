import React, {useEffect, useRef,useMemo,useState,useLayoutEffect} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as THREE from 'three';
import * as d3 from 'd3';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

//helper function to  wait for window resize
function useWindowSize() {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
      function updateSize() {
        setSize([window.innerWidth, window.innerHeight]);
      }
      window.addEventListener('resize', updateSize);
      updateSize();
      return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
}

export default function Particle3D(props){
    //this is a generic component for plotting a d3 plot
    const container = useRef(null);

    const [screensize] = useWindowSize();
    const [height,setHeight] = useState(0);
    const [width,setWidth] = useState(0);
    const [scene,setScene] = useState();
    const relativePointSize= 10;
    const unbrushedOpacity = 0.25;

    //get the size of the convas
    useEffect( () => {
        //wait for mounting to calculate parent container size
        if(!container.current){ return; }
        var h = container.current.clientHeight*.99;
        var w = container.current.clientWidth;

        setHeight(h);
        setWidth(w);

    },[container.current,screensize]);

    //set up camera with light
    const camera = useMemo(() => {
        //setup camera
        if(width <= 0 || height <= 0){ return; }

         //how big the head is relative to the scene 2 is normal;
        var camera = new THREE.PerspectiveCamera( 75, width / height, 5, 100 );
        // Add a directional light to show off the objects
        var light = new THREE.DirectionalLight( 0xffffff, 1.5);
        // Position the light out from the scene, pointing at the origin
        light.position.set(0,2,20);
        light.lookAt(0,0,0);

        camera.add(light);

        return camera
    },[height, width]);

    //set up the renderer
    var renderer = useMemo(()=>{
        if(width <= 0 || height <= 0){ return; }
        var renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        //background color
        renderer.setClearColor(0xFFFFFF, 1);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height)
        if(container.current.children[0]){
            container.current.removeChild(container.current.children[0]);
        }
        container.current.appendChild(renderer.domElement);
        return renderer;
    },[width,height]);

    //set up orbit controls
    const controls = useMemo(()=>{
        if(camera === undefined | renderer === undefined){ return }
        var controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 1;
        controls.maxDistance = 5000;
        camera.position.set(2,2,12);
        controls.enablePan = false;
        camera.lookAt(0,0,0);
        controls.enablePan = false;
        controls.update();

        return controls
    },[renderer,camera]);



    //create the scene with the pointcloud when the data loads
    //this should run once when the data loads
    useEffect(()=>{
        if(props.bounds !== undefined & camera !== undefined){
            var s = new THREE.Scene();
            s.add(camera);

            //the extents of the data
            const bounds = props.bounds;
            //for centering the y valus at the center of the cylinder
            const centerY = ((bounds.maxY - bounds.minY)/2);


            //TODO (optional): filter out particles below 80% of the maximum concentration here


            //get positions for particle positions
            //THREE.js buffer attributes uses a 1d vector of length n_items x item_dimensions
            //e.g. [x0,y0,z0,x1,y1,z1,x2 ....]
            var vertices = [];
            for(var d of props.data){
                vertices.push(d.position[0])
                vertices.push(d.position[2]-centerY);
                vertices.push(d.position[1]);
            }
            //specify item_dimenstions when creating the attribute
            var verts = new THREE.BufferAttribute(new Float32Array(vertices),3);

            var pointGeometry = new THREE.BufferGeometry();
            //set a name so we can access the points it in the brushing update
            pointGeometry.name = 'pointGeometry';
            pointGeometry.setAttribute('position',verts);

            //sizee is size of particles, vertexColors and transparent lets us change the color and alpha of individual points
            var pointMaterial = new THREE.PointsMaterial({
                size: relativePointSize*width/props.data.length,
                vertexColors: true,
                transparent: true,
            });

            var pointCloud = new THREE.Points( pointGeometry, pointMaterial );
            pointCloud.name = "pointCloud";
            s.add(pointCloud);

            //draw a plane to show where we're brushing
            var radius = (bounds.maxX - bounds.minX)/2.0 + .1;
            var planeGeometry = new THREE.PlaneGeometry(2*radius + 1, 2*radius + 1);
            var planeMaterial = new THREE.MeshBasicMaterial({
                color: 0xcccccc,
                opacity: .5,
                transparent: true
            });
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.name = "filterPlane";
            //add plane to scene
            s.add(plane);
            setScene(s);
        }
    },[camera,props.data]);

    //render the colors for the scene pointclouds when the brushedCoord value updates
    //this should run each time a brushing parameter changes
    useEffect(()=>{
        if(scene === undefined| props.data === undefined){ return }

        const bounds = props.bounds;

        //color for brushed points
        const saturatedColorScale = d3.scaleSymlog()
            .domain([0,bounds.maxC])
            .range(props.colorRange);
        //color for unbrushed points
        const desaturatedColorScale = d3.scaleSymlog()
            .domain([0,bounds.maxC])
            .range(['#d9d9d9','#252525']);

        //check if points are withing a set distance of the center of the brush plane
        function isBrushed(d){
            var dist = props.brushedCoord - props.getBrushedCoord(d);
            return Math.abs(dist) < props.brushedAreaThickness;
        }

        //calculate the color for a point in the for [r,g,b,alpha] for threejs
        function getColor(d){
            let alpha = 1;
            var c = saturatedColorScale(d.concentration);
            if(!isBrushed(d)){
                alpha = unbrushedOpacity;
                c = desaturatedColorScale(d.concentration);
            }
            c = d3.color(c);
            //three js uses r,g,b,a
            let color = [c.r/255,c.g/255,c.b/255,alpha];
            return color
        }

        //TODO (optional): filter out particles below 80% of the maximum concentration here
        
        //vertex colors as a 1d vector
        var vertexColors = [];
        for(var d of props.data){
            var color = getColor(d);
            vertexColors.push(...color);
        }

        //specify that we use 4 dimensions (r,g,b,a) in the constructor
        var colors = new THREE.BufferAttribute(new Float32Array(vertexColors),4);
        //update the pointcloud colors
        scene.getObjectByName('pointCloud').geometry.setAttribute('color',colors);
        scene.getObjectByName('pointCloud').geometry.colorsNeedUpdate = true;

        //move the feature plane to the new brush location
        var fplane = scene.getObjectByName('filterPlane');
        let coords = ['x','y','z']
        for(let c of coords){
            if(c === props.brushedAxis){
                fplane.position[c] = props.brushedCoord;
            } else{
                fplane.position[c] = 0;
                fplane.rotation[c] = 0;
            }
        }
        if(props.brushedAxis === 'y'){     
            fplane.rotation.y = 0;
            fplane.rotation.x = -Math.PI/2;
        } else if(props.brushedAxis === 'x'){
            fplane.rotation.y = Math.PI/2;
            fplane.rotation.x = 0
        } else{
            fplane.rotation.y =0;
            fplane.rotation.x = 0;
        }
    },[scene,props.brushedCoord,props.brushedAxis])

    
    //main anime loop
    useEffect(() => {
        if(!renderer || !scene || !camera){ 
            return; 
        }
        const animate = function () {
            requestAnimationFrame( animate );
            renderer.clear();
            if(controls){
                controls.update()
            }
            renderer.render( scene, camera );
        }
    
        animate();
    },[renderer, scene, camera, renderer]);

    //cleanup function, more useful if you are changing scenes dynamically
    useEffect(() => {
        return () => {
            if(!renderer){return;}
            renderer.forceContextLoss();
        }
    },[renderer]);

    

    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={container}
        ></div>
    );
}