import * as beck from "./beckersfunctions.js";
import * as d3 from "d3";
import * as d3geoprojection from "d3-geo-projection";
import { GUI } from 'lil-gui';


let gui;
let width, height, size, box;
let projection, geoGenerator;
let geojson;
let scalefactor;

const params = {
    info: () => info(),
    patchnumber: 1000,
    projChoice: 'Equal area',
    saveSvg: () => saveSvg(),
    exportData: () => exportData(),
    article: () => window.open('https://doi.org/10.1016/j.comgeo.2012.01.011', '_blank').focus(), 
    source: () => window.open('https://github.com/abugeat/BeckersMesher', '_blank').focus(),
    me: () => window.open('https://www.linkedin.com/in/antoine-bugeat-452167123/', '_blank').focus(),
};

const projs = [
    'Equal area',
    'Stereographic',
    'Equidistant',
    'Orthographic',
    'Perspective',
    'Equirectangular',
    'Mollweide',
];

function init() {
    
    // lil-gui
    gui = new GUI();
    gui.title("BeckersMesher");
    gui.add( params, 'info' ).name( 'Info' );
    const folder_mesh = gui.addFolder( 'Mesh' );
    folder_mesh.add( params, 'patchnumber', 10, 10000, 1 ).name( 'Number of patches' ).onChange( resize );
    folder_mesh.add( params, 'projChoice', projs ).name( 'Projection' ).onChange( resize );
    folder_mesh.add( params, 'saveSvg').name( 'Save as .SVG' );
    folder_mesh.add( params, 'exportData').name( 'Export data' );
    const folder_about = gui.addFolder( 'About' );
    folder_about.add( params, 'article').name( 'Beckers partition' );
    folder_about.add( params, 'source').name( 'Source code' );
    folder_about.add( params, 'me').name( 'Me' );
    gui.open(true);

    getShape();

    setProjandgeoGene();

    makegeojson();

    update(geojson);
}

function info() {
    let infodiv = document.getElementById('info');
    if (infodiv.style.display == 'flex') {
        infodiv.style.display = 'none';
    } else {
        infodiv.style.display = 'flex';
    }
}
 
function getShape() {
    // create svg in div content
    d3.select("#content").append("svg").attr("id","svg").attr("width","100%").attr("height","100%");
    d3.select("#svg").append('g').attr("class","map");

    // resize div content and get size
    box = document.getElementById('content');
    width = window.innerWidth;
    height = window.innerHeight;
    size = Math.min(width,height);
    box.style.width = size+"px"; 
    box.style.height = size+"px";
}

function setProjandgeoGene() {
    switch (params.projChoice) {
        case 'Equal area':
            projection = d3.geoAzimuthalEqualArea()
                .scale(size / 3 ) //.scale(size/(1.414213*2))
                .rotate([0, -90])
                .translate([size / 2, size / 2]);
            break;
        case 'Stereographic':
            scalefactor = d3.geoAzimuthalEqualAreaRaw(0,Math.PI/2)[1] / d3.geoStereographicRaw(0,Math.PI/2)[1];
            projection = d3.geoStereographic()
                .scale(size / 3 * scalefactor)
                .rotate([0, -90])
                .translate([size / 2, size / 2]);
            break;
        case 'Equidistant':
            scalefactor = d3.geoAzimuthalEqualAreaRaw(0,Math.PI/2)[1] / d3.geoAzimuthalEquidistantRaw(0,Math.PI/2)[1];
            projection = d3.geoAzimuthalEquidistant()
                .scale(size / 3 * scalefactor)
                .rotate([0, -90])
                .translate([size / 2, size / 2]);
            break;
        case 'Orthographic':
            scalefactor = d3.geoAzimuthalEqualAreaRaw(0,Math.PI/2)[1] / d3.geoOrthographicRaw(0,Math.PI/2)[1];
            projection = d3.geoOrthographic()
                .scale(size / 3 * scalefactor)
                .rotate([0, -90])
                .translate([size / 2, size / 2]);
            break;   
        case 'Perspective':
            scalefactor = d3.geoAzimuthalEqualAreaRaw(0,Math.PI/2)[1] / d3.geoOrthographicRaw(0,Math.PI/2)[1];
            projection = d3.geoOrthographic()
                .scale(size / 3 * scalefactor)
                .rotate([0, -30])
                .translate([size / 2, size / 2]);
            break;   
        case 'Equirectangular':
            scalefactor = d3.geoAzimuthalEqualAreaRaw(0,Math.PI/2)[1] / d3.geoEquirectangularRaw(0,Math.PI/2)[1];
            projection = d3.geoEquirectangular()
                .scale(size / 3 * scalefactor / 2)
                .rotate([0, 0]) 
                .translate([size / 2, size / 2]);
            break;   
        case 'Mollweide':
            scalefactor = d3.geoAzimuthalEqualAreaRaw(0,Math.PI/2)[1] / d3geoprojection.geoMollweideRaw(0,Math.PI/2)[1];
            projection = d3geoprojection.geoMollweide()
                .scale(size / 3 * scalefactor / 2 )
                .rotate([0, 0]) 
                .translate([size / 2, size / 2]);
            break;
    }
    
    geoGenerator = d3.geoPath()
        .projection(projection);
}

function resize() {
    d3.select('#svg').remove();
    getShape();
    setProjandgeoGene();
    makegeojson();
    update(geojson);
}

function makegeojson() {
    geojson = {
        "type": "FeatureCollection",
        "features": beck.beckersGeojsonFeature(params.patchnumber),
    };
}
  
function update(geojson) {
    let u = d3.select('#content g.map')
        .selectAll('path')
        .data(geojson.features)
        // .attr("d",)
        .enter()
        .append('path')
        .attr('d', geoGenerator)
        .attr('stroke', 'black')
        // .attr("fill", 'rgb(100,100,100)');
        .attr("fill", function (d) {
            // return 'rgb('+(1-(d.id/params.patchnumber))*255+','+(1-(d.id/params.patchnumber))*255+','+(1-(d.id/params.patchnumber))*255+')';
            return 'rgba(255,255,255,0)';

        });
}

function saveSvg() {
    let svgEl = document.getElementById("svg");
    let name = 'beckersmesh_abugeat.svg';
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var svgData = svgEl.outerHTML;
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml; charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function exportData() {
    let bmesh = hemi_equi_LMTV(inc(params.patchnumber));
    var a = document.body.appendChild(
        document.createElement("a")
    );
    a.download = "beckersmesh_abugeat.txt";
    a.href = "data:text/plain;base64," + btoa(JSON.stringify(bmesh));
    a.click();
}

init();