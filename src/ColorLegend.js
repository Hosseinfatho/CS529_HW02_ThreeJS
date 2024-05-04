import React, {useEffect, useRef} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

export default function ColorLegend(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);
    const yMargin = 20;
    const xMargin = 50;
    //estimate how much space is needed for text
    const textLength = Math.max(width*.5,10);

    //increments we're showing for the legend, as fractions of the maximum value
    const increments = [0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1];
    //you can use a hook like this to set up axes or things that don't require waiting for the data to load so it only draws once
    useEffect(()=>{
        if(svg !== undefined & props.bounds !== undefined){


            //TODO (optional) change the color scale to match changes to scale in LinkedViewD3.js
            let colorScale = d3.scaleLinear()
                .domain([0,props.bounds.maxC])
                .range(props.colorRange);

            //size of each bar in the legend
            const barHeight = Math.max((height - 2*yMargin)/increments.length,1);
            const barWidth = Math.max(width - textLength - 2*xMargin,1);

            let currY = yMargin;
            const blockData = [];
            for(let i of increments){
                let entry = {
                    'value': props.bounds.maxC*i,
                    'color': colorScale(props.bounds.maxC*i),
                    'y': currY,
                }
                blockData.push(entry)
                currY += barHeight;

            }
            
            //draw legend colors
            svg.selectAll('rect').remove();
            svg.selectAll('rect').data(blockData)
                .enter().append('rect')
                .attr('x',xMargin)
                .attr('y',d=>d.y)
                .attr('width',barWidth)
                .attr('height',barHeight)
                .attr('fill',d=>d.color);

            //draw legend labels
            svg.selectAll('text').remove();
            svg.selectAll('text').data(blockData)
                .enter().append('text')
                .attr('x',barWidth + 2 + xMargin)
                .attr('y', d=>d.y + barHeight/2)
                .attr('font-size',Math.max(barHeight/4,10))
                .text(d=>d.value.toFixed(2));
        }
    },[svg,props.bounds])

    
    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}