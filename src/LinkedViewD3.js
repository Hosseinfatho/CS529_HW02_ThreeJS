import React, {useEffect, useRef} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';


//get the velocity direction based on the axis we are slicing
function sliceVelocity(d,axis){
    var xv = d.velocity[1];
    var yv = d.velocity[2];
    if(axis == 'y'){
        xv = d.velocity[0];
        yv =  d.velocity[1];
    } else if(axis == 'z'){
        xv = d.velocity[0];
    }
    return [xv, yv]
}

//TODO: modify this to make a new glyph that captures both the in-plane velocity and concentration
//example function/code for making a custom glyph
//d is the data point {position, velocity,concentration}, axis is ['x','y','z'], scale is optional value to pass to help scale the object size
//Hint: you might need to pass an additional argument here to scale the new glyph with concentration
function makeVelocityGlyph(d,axis,scale=1){
    
    let [xv,yv] = sliceVelocity(d,axis);
    let velocity = scale*Math.sqrt(xv**2 + yv**2);
    //draws an arrow scaled by the velocity. we draw straight to the right and then rotate it using transforms
    let path = 'M ' + velocity + ',' + 0 + ' '
        + 0 + ',' + -Math.min(3,velocity/3) + ' '
        + 0 + ',' + Math.min(3,velocity/3);

    //Hint: If you want to add something on top of the arrows, add the code for the new shape onto the path here;
    return path
    
}


//calculate the angle to rotate the glyph so the arrow points in the correct direction based on velocity
function calcVelocityAngle(d,axis){
    //The coordinates for svg are downward so we flip the angle when doing the transform
    let [xv,yv] = sliceVelocity(d,axis);
    let angle = 180*Math.atan2(yv,xv)/Math.PI;
    return -angle;
}

export default function LinkedViewD3(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);

    const margin = 10;
    //sets a number of the number of particles we show when the brushed area has is too large
    const maxDots = 2000;
    
    //draw the points in the brushed area
    useEffect(()=>{
        if(svg !== undefined & props.data !== undefined & props.bounds !== undefined){
            //filter data by particles in the brushed region
            const bDist = d => props.brushedCoord - props.getBrushedCoord(d);
            function isBrushed(d){
                return Math.abs(bDist(d)) < props.brushedAreaThickness;
            }
            var data = props.data.filter(isBrushed);

            const bounds = props.bounds;

            //Hint: I'm logging the bounds because you're supposed to use them later
            console.log('bounds',bounds)

            var xExtents = [bounds.minZ, bounds.maxZ];
            var yExtents = [bounds.minY, bounds.maxY];
            if(props.brushedAxis === 'y'){
                xExtents = [bounds.minX, bounds.maxX];
                yExtents = [bounds.minZ, bounds.maxZ];
            } else if(props.brushedAxis === 'z'){
                xExtents = [bounds.minX, bounds.maxX];
            }

            var getX = d => d.position[1];
            var getY = d => d.position[2];
            if(props.brushedAxis == 'y'){
                getX = d => d.position[0];
                getY = d => d.position[1];
            } else if(props.brushedAxis == 'z'){
                getX = d => d.position[0];
            }

            //TODO: filter out points with a concentration of less than 80% of the maximum value of the current filtered datapoints


            //limit the data to a maximum size to prevent occlusion
            data.sort((a,b) => bDist(a) - bDist(b));
            data = data.filter(d=>d.concentration > .3*bounds.maxC)
            if(data.length > maxDots){
                data = data.slice(0,maxDots);
            }

            const getVelocityMagnitude = d => Math.sqrt(d.velocity[0]**2 + d.velocity[1]**2 + d.velocity[2]**2);
            const vMax = d3.max(data,getVelocityMagnitude);
            
            //custom radius based on number of particles
            const radius = Math.max(3*Math.min(width,height)/data.length,5);

            //scale the data by the x and z positions
            let xScale = d3.scaleLinear()
                .domain(xExtents)
                .range([margin+radius,width-margin-radius])

        
            let yScale = d3.scaleLinear()
                .domain(yExtents)
                .range([height-margin-radius,margin+radius])

            //TODO: FIX THE EXTENTS (Hint: this should match the legend)
            let colorScale = d3.scaleLinear()
                .domain(yExtents)
                .range(props.colorRange);

            

            //TODO: map the color of the glyph to the particle concentration instead of the particle height
            let dots = svg.selectAll('.glyph').data(data,d=>d.id)
            dots.enter().append('path')
                .attr('class','glyph')
                .merge(dots)
                .transition(100)
                .attr('d', d => makeVelocityGlyph(d,props.brushedAxis,60*vMax/radius))
                .attr('fill',d=>colorScale(getY(d)))
                .attr('stroke','black')
                .attr('stroke-width',.1)
                .attr('transform',d=>'translate(' + xScale(getX(d)) + ',' + yScale(getY(d)) + ')rotate('+calcVelocityAngle(d)+')')

            //Add a simple tooltip for debugging purposes
            dots.on('mouseover',(e,d)=>{
                    var [xv,yv] = sliceVelocity(d,props.brushedAxis);
                    var tString = ' velocity: ' + xv.toFixed(2) + ', ' + yv.toFixed(2) + '</br>angle: '+ calcVelocityAngle(d).toFixed(1) + '</br> concentration: '+ d.concentration.toFixed(0);

                    tTip.html(tString)
                }).on('mousemove',(e)=>{
                    ToolTip.moveTTipEvent(tTip,e);
                })
                .on('mouseout',(e,d)=>{
                    ToolTip.hideTTip(tTip);
                });

            dots.exit().remove()
        }
    },[svg,props.data,props.getBrushedCoord,props.bounds])

    
    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}

class ToolTip {
    static moveTTip(tTip, tipX, tipY){
      var tipBBox = tTip.node().getBoundingClientRect();
      while(tipBBox.width + tipX > window.innerWidth){
          tipX = tipX - 10 ;
      }
      while(tipBBox.height + tipY > window.innerHeight){
          tipY = tipY - 10 ;
      }
      tTip.style('left', tipX + 'px')
          .style('top', tipY + 'px')
          .style('visibility', 'visible')
          .style('z-index', 1000);
    }
  
    static moveTTipEvent(tTip, event){
        var tipX = event.pageX + 30;
        var tipY = event.pageY -20;
        this.moveTTip(tTip,tipX,tipY);
    }
  
  
    static hideTTip(tTip){
        tTip.style('visibility', 'hidden')
    }
  
    static addTTipCanvas(tTip, className, width, height){
        tTip.selectAll('svg').selectAll('.'+className).remove();
        let canvas = tTip.append('svg').attr('class',className)
            .attr('height',height).attr('width',width)
            .style('background','white');
        return canvas
    }
  }