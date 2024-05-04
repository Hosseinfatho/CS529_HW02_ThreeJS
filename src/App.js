import React, {useState,useEffect, useMemo,useRef} from 'react';
import './App.css';

import Particle3D from './Particle3D';
import LinkedViewD3 from './LinkedViewD3';
import ColorLegend from './ColorLegend';

import * as d3 from 'd3';
function App() {

  //data
  const [particleData, setParticleData] = useState();
  //states for brushing and linking
  const [brushedCoord, setbrushedCoord] = useState(0);
  const [brushedAxis, setBrushedAxis] = useState('x');

  //TODO: Edit this to change the extents of the color scale for the linked view
  //saturated color scale used to color the particles
  const colorRange = ['#c6dbef','#084594'];

  //how wide the 'brushed' area should be
  const brushedAreaThickness= .5;

  //TODO: for extra credit, set this to false if you want to allow the cross-section plane (brushedAxis) to be toggleable in the Particle3D View
  //otherwise, fix the value to 'x' so the code in LinkedViewD3 doesn't break
  const allowAxisToggle=true;

  //here we parse the data as a list of objects
  //with values position ([x,y,z]), velocity ([x,y,z]) and concentration (number)
  async function fetchData(){
    d3.csv('particledata_058.csv').then(d=>{
      let newData = [];
      var i = 0;
      for(const obj of d){
        let entry = {}
        entry.position = [obj.Points0,obj.Points1,obj.Points2].map(dd=>parseFloat(dd));
        entry.velocity = [obj.velocity0,obj.velocity1,obj.velocity2].map(dd=>parseFloat(dd));
        entry.concentration = Number(obj.concentration);
        entry.id = i;
        newData.push(entry);
        i+=1;
      }
      console.log('particle data',newData)
      setParticleData(newData);
    })
  }

  //wrapper for updating the axis we're slicing through for brushing 
  //reset the coordinate on a toggle
  function toggleBrushedAxis(coord){
    if(allowAxisToggle & brushedCoord !== coord){
      setBrushedAxis(coord);
      setbrushedCoord(0);
    }
  }

  //wrapper for increasing brush coordinate position on events
  function incrementBrush(scale){
    let newY = brushedCoord + brushedAreaThickness*scale;
    setbrushedCoord(newY);
  }

  //event handler for key presses (up/down for incrementing brush event)
  function handleKeyPress(e){
      console.log('e',e)
      e.preventDefault();
      if(e.keyCode === 38){
          incrementBrush(.1)
      } else if(e.keyCode=== 40){
          incrementBrush(-.1);
      }
  }

  //fetch the dta 
  useEffect(()=>{
    fetchData();
  },[]);

  //calculate the extents of the datapoints once
  function getBounds(data){
    if(data === undefined){
        return 
    }
    var bounds = {};
    data.forEach(function(d) {
                // get the min bounds
                const p = d.position
                bounds.minX = Math.min(bounds.minX || Infinity, p[0]);
                bounds.minY = Math.min(bounds.minY || Infinity, p[2]);
                bounds.minZ = Math.min(bounds.minZ || Infinity, p[1]);

                // get the max bounds
                bounds.maxX = Math.max(bounds.maxX || -Infinity, p[0]);
                bounds.maxY = Math.max(bounds.maxY || -Infinity, p[2]);
                bounds.maxZ = Math.max(bounds.maxZ || -Infinity, p[1]);

        bounds.maxC = Math.max(bounds.maxC || -Infinity, d.concentration);
            });
        return bounds
  }


  //calculate bounds of the data once loaded
  const bounds = useMemo(()=>{
      return getBounds(particleData);
  },[particleData])


  //conditional accessor for the data feature we're using the brush the data
  function getBrushedCoord(d){
      if(brushedAxis === 'y'){
          return d.position[2] - ((bounds.maxY - bounds.minY)/2)
      } else if(brushedAxis === 'z'){
          return d.position[1]
      }
      return d.position[0]
  }

  //make buttons that toggle which axis we're using to slice the data
  const axisToggles = ['x','y','z'].map(c => {
    let active = c === brushedAxis;
    let variant = active? 'activeButton':'inactiveButton';
    return(<button
      onClick={()=>toggleBrushedAxis(c)}
      className={variant}
    >{c}</button>)
  })

  //tabIndex is needed to put the keypress event on the div
  return (
    <div 
      onKeyUp={handleKeyPress}
      tabIndex={0}
      className="App" style={{'height':'100vh','width':'100vw'}}
    >
      <div style={{'maxHeight': '7vh'}}>
        <h1>{"Fluid Simulation"}</h1>
      </div>
      <div 
        className={'shadow'}
        style={{'height':'50vw','width':'calc(49vw - 10em)','maxHeight':'80vh','display':'inline-block','margin':'3px'}}
      >
        <Particle3D
          colorRange={colorRange}
          bounds={bounds}
          data={particleData}
          brushedCoord={brushedCoord}
          brushedAreaThickness={brushedAreaThickness}
          brushedAxis={brushedAxis}
          getBrushedCoord={getBrushedCoord}
        />
      </div>
      <div 
        className={'shadow'}
        style={{'height':'50vw','width':'calc(48vw - 10em)','maxHeight':'80vh','display':'inline-block','margin':'3px'}}
      >
        <LinkedViewD3
          colorRange={colorRange}
          data={particleData}
          bounds={bounds}
          brushedCoord={brushedCoord}
          brushedAreaThickness={brushedAreaThickness}
          brushedAxis={brushedAxis}
          getBrushedCoord={getBrushedCoord}
        />
      </div>
      <div 
        style={{'height':'50vw','width':'20em','maxHeight':'80vh','display':'inline-block','marginTop':'0px'}}
      >
        <div style={{'width':'100%','maxHeight':'5em','margin':'0px'}}>
          <h4 style={{'margin':'0px','padding':'0px'}}>{"Instructions"}</h4>
          <p style={{'margin':'0px','padding':'0px'}}>{'Use up/down arrows to move brushed area'}</p>
          <p style={{'margin':'0px','padding':'0px'}}>{"Use buttons to change orientation of plane"}</p>
        </div>
        <div style={{'width':'100%','height': '3em','marginTop':'1em'}}>
          {'Slice Plane: '}
          {axisToggles}
        </div>
        <div style ={{'width': '100%','height':'calc(100% - 9em)'}}>
          <div style={{'width':'100%','height':'1.5em','fontSize':'1.5em'}}>
            {'Concentration'}
          </div>
          
          <div style={{'width':'100%','height':'calc(100% - 2em)'}}>
          <ColorLegend
            colorRange={colorRange}
            bounds={bounds}
          />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
