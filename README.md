# Instructions
Credits: The support code in this repo has been created by Andrew Wentzel, a member of the Electronic Visualization Laboratory, as teaching support for UIC's CS529 Visual Data Science course.

### Getting the code

Follow the same steps as in Hw01, but using the Hw02 git code repository.

### Installation

Installation is the same as in Hw01: Go to the folder with the Hw02 code and install the required modules (d3 and three) using 

> npm install

and then test the code with 

> npm start

## If making a repo from scratch
Instead of the above, do
> npm install d3

and then

> npm install three

Then test the code with 

> npm start


### Code Structure

In addition to what you learned in the previous homework, this homework introduces 3D graphics on the web, spatial data, creating a custom visual encoding, and the use of multiple coordinated views (which can be coordinated via brushing and linking etc.). By default, the support (template) code sets up the window with a basic THREE.js canvas view, a basic D3 canvas view, and a color legend. It also provides code for loading and displaying a 3D particle pointcloud (in the THREE canvas) and the result of performing a 2D slicing operation through the pointcloud (in the D3 canvas), and code for loading and passing variables for linking the two views. 


The support code changes by default the brushing plane position variable "brushedCoord" when the user uses the arrow keys. 

 * App.js contains the high-level app with the high-level code strucutre. You will need to modify this file to add titles.
 * Particle3D.js contains the code to handle the THREE.js pointcloud. It sets up the required code to render anything you add to the scene with scene.add. You will need to modify this file.
 * LinkedViewD3 contains the template for the linked view that shows a 2-dimensional cross section of the particles and the custom visual encoding. You will need to modify this file.
 * ColorLegend.js contains code for the color legend for the LinkedView. Editing this file is optional unless you wish to change the color scheme.

 Since we use brushing to link the view, there are objects (e.g., particles) in the high-level App.js that are shared between views. To access these objects from the views (e.g., in LinkedViewD3 and in Patricle3D), we use "props." (e.g.props.brushedCoord) to access that object (e.g., in this case, the coordinates of the particles being brushed by the cutting plane). Here are some of the objects/attributes that we use in the code:

 * brushedCoord: the coordinate in the given plane (defaults to zy plane) that we want to brush. 
 * brushedAxis: the plane we are slicing. 'x' is the zy plane, 'y' is the zx plane, etc. By default this is set to 'x' and can be ignored, unless you set "allowAxisToggle=false;" for extra credit
 * bounds: the dimensional bounds ({minX, maxX, minY, maxY, minZ, maxZ}) of the particle system. The bounds are passed to props so we can scale the visualizations
 * getBrushedCoord: function that takes a data point object for a particle and returns the position in the axis that we are slicing for the cross-section based on brushedAxis and bounds. This makes it easier to check if the particle is in the plane we are slicing through.
 * brushedAreaThickness: a constant used to set the width of the area that we are considering for the cross-section plane. Larger values are easier to see in the Three.JS view but yield higher occlusion in the D3 view.


 ### Data Structure

 We process the data and return is as an Array of objects with the features:

 * Position => float: [x,y,z]
 * Velocity => float: [x,y,z]
 * Concentration => float: c


### Notes

This code introduces THREE.js, a cross-browser JavaScript library and application programming interface (API) used to create and display animated 3D computer graphics in a web browser via webGL. The THREE.js documentation can be found here: 

https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene

We have integrated three.js with react using refs. There is also a popular library named react-three-fiber which is meant to turn threejs into react components if you wish to do that in later projects. Fiber requires less template code: 

https://docs.pmnd.rs/react-three-fiber/getting-started/introduction

However, react-fiber has poor documentation that assumes knowledge of the original API, so we recommend learning vanilla three.js first.
