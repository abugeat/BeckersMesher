// B&B
function inc(ncell) {
    // Input: number of mesh wanted
    // Output : number of cell per ring (cumulated) from zenith to horizon

    let tim1  = Math.PI/2;
    let rim1  = 2*Math.sin(tim1/2);

    // Input data
    let idep  = ncell; 
    let cim1  = idep;
    
    // Finding a tentative realistic number of rings
    let nring = Math.floor(Math.sqrt(idep));
    let ac    = new Array(nring).fill(0);
    let as    = new Array(nring).fill(0);
    let n     = new Array(nring).fill(0);
    // initializations
    let nucel = [];
    let nan   = 0;
    for (let i=0; i<nring; i++){
        n[i]  = cim1;                        // Number of cells in ring i
        let ti    = tim1-rim1*Math.sqrt(Math.PI/cim1);
        as[i] = 2*Math.PI/idep/(ti-tim1)**2;       // Aspect ratio on te sphere
        let ri    = 2*Math.sin(ti/2);
        ac[i] = 2*Math.PI/idep/(ri-rim1)**2;       // Aspect ratio on te disk
        let ci    = Math.round(cim1*(ri/rim1)**2);
        tim1  = ti;
        rim1  = ri;
        cim1  = ci;
        // Forcing the presence of a central disk
        if (cim1 == 2) {
            cim1=1;
            ci=1;
        }
        if (cim1 == 0) {
            cim1=1;
            ci=1;
        }
        if (cim1 == 1) {
            if (nan ==0) {
                nan=i+1;
            }
        }
    }
    let kk=nan;
    for (let i=0; i<nan; i++) {
        kk=kk-1;
        nucel[kk]=n[i];
    }

    // add top round patch
    nucel.unshift(1);

    return nucel;
}

function hemi_equi_LMTV(nucel) {
    
    let nan = nucel.length;                             // number of sky rings
    let lat = new Array(nucel[nan-1]).fill(0);          // patch latitud
    let latb = new Array(nucel[nan-1]).fill(0);
    let lon = new Array(nucel[nan-1]).fill(0);          // patch longitud 
    let rzone=new Array(nucel[nan-1]).fill([0,0,0]);    // patch direction 
    
    // tracé des segments de méridiens
    let vr = new Array(nan).fill(1); // ones(nan,1);
    for (let i=1; i<nan; i++) {
        vr[i] = vr[i-1]*Math.sqrt(nucel[i]/nucel[i-1]);
    }

    // vr = vr/vr(nan); // need .map!
    vr = vr.map(x => x/vr[nan-1]);

    let hauteur = new Array(nan).fill(0); // zeros(nan,1);
    let dis = new Array(nan).fill(1); //ones(nan,1);
    let lati_b_cell = new Array(nan).fill(0); //zeros(nan,1);
    let lati_cell = new Array(nan).fill(0); // zeros(nan,1);
    
    for (let i = 0; i<nan; i++) {
        hauteur[i]=Math.sqrt((1-vr[i]**2)**2/(2-vr[i]**2)); 
        dis[i]=Math.sqrt(hauteur[i]**2+vr[i]**2);
        lati_b_cell[i]=Math.acos(vr[i]/dis[i]);
    }
    
    lati_cell[0]=0; 
    for (let i=0; i<(nan-1); i++) {
        lati_cell[i+1]=(lati_b_cell[i]+lati_b_cell[i+1])/2;
    }
    
    let ipoi=0;
    let nmerid, longi;
    for (let i=0; i<(nan-1); i++) {
        nmerid = nucel[i+1]-nucel[i]; // nombre de cellules dans 1 anneau
        longi = -Math.PI/nmerid;
        for (let j=0; j<nmerid; j++) {
            ipoi += 1;
            lat[ipoi]=lati_cell[i+1];
            longi=longi+2*Math.PI/nmerid;
            lon[ipoi]=longi;
            latb[ipoi]=lati_b_cell[i+1];
        }
    }
        
    // Affichage des latitudes et longitudes des cellules en radians
    let nmesh = lat.length;
    let as = new Array(nmesh).fill(1); //*(2*pi/nmesh); //Angle solide de chaque maille (supposé égaux)
    as = as.map(x => x*(2*Math.PI/nmesh));
    lat[0] = Math.PI/2;

    let skymesh = new Array(nmesh).fill([0,0,0]);
    for (let i = 0; i <nmesh; i++) {
        skymesh[i] = [lat[i], lon[i], as[i]];
    }

    // reshape in list of list from top to bottom
    let newlat = [[lati_b_cell[0]]];
    let newlon = [[0]];
    for (let i = 0; i< nucel.length-1; i++) {
        newlat.push(latb.slice(nucel[i],nucel[i+1]));
        newlon.push(lon.slice(nucel[i],nucel[i+1]));
    }

    // shift lon
    for (let i = 1; i< nucel.length; i++) {
        let shift = newlon[i][0];
        newlon[i] = newlon[i].map(x => x+shift - Math.PI);
    }
  
    // convert radians to degrees
    for (let i = 0; i< nucel.length; i++) {
        newlon[i] = newlon[i].map(x => x*180/Math.PI);
        newlat[i] = newlat[i].map(x => x*180/Math.PI);
    }

    let bmesh = [newlat, newlon];

    return bmesh;
} 

function createPatch(patches, id) {
    let patchjson = {
        "type": "Feature",
        "properties": {
            "name": "beckersmesh"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [patches],
        },
        "id": parseInt(id),
    }; 
    return patchjson;
}

function getnSteps(lonStart, lonEnd, lat) {
    let lonDif = lonEnd - lonStart;
    let newSteps = Math.round( (Math.abs(lonDif) / 2.5)); //  * Math.cos(lat/180*Math.PI)  
    return newSteps;
}

function circle(lat) {
    let lon1 = [[-180, lat]];
    for (let i=0; i<145; i++) {
        let lon = -180 + i * 2.5;
        lon1.push([lon, lat]);
    }
    return lon1.reverse();
} 

function circlepolygon(lat) {
    let lon1 = [[-180, lat]];
    let lon;
    for (let i=0; i<145; i++) {
        lon = -180 + i * 2.5;
        lon1.push([lon, lat]);
    }
    lon1.push([-180, lat]);
    return lon1.reverse();
} 

function intermediatePoints(lonStart, lonEnd, nSteps, lat) {
    
    // nSteps = 50;
    let interPoints = []; 
    if (nSteps != 0) {

        let lonSteps = (lonEnd - lonStart) / nSteps;
        interPoints = new Array(nSteps);
        let newLon = lonStart+lonSteps;

        for (let i = 0; i < nSteps; i++) {
            interPoints[i] = [newLon, lat];
            newLon += lonSteps;
        }
    }
        
    return interPoints;
}

function beckersGeojsonFeature(ncell) {
    let bmesh = hemi_equi_LMTV(inc(ncell));

    let latb = bmesh[0];
    let lonb = bmesh[1];
    let meshgeojson = [];
    
    // zenith circle patch
    meshgeojson.push(createPatch(circlepolygon(latb[0][0]),0));

    // square patches
    let patch = [];
    let id;
    for (let ring = 1; ring < latb.length; ring++) {
        let nSteps = getnSteps(lonb[ring][0],-179.99,latb[ring][0]);
        // first patch
        patch = [
            [lonb[ring][0], latb[ring][0]],
            ...intermediatePoints(lonb[ring][0],-179.99,nSteps,latb[ring][0]),
            [-179.99,       latb[ring][0]],
            [-179.99,       latb[ring-1][0]],
            ...intermediatePoints(-179.99,lonb[ring][0],nSteps,latb[ring-1][0]),
            [lonb[ring][0], latb[ring-1][0]],
            [lonb[ring][0], latb[ring][0]]
        ];
        id = meshgeojson.length;
        meshgeojson.push(createPatch(patch,id));
        
        // other patches of the ring
        for (let i = 1; i < latb[ring].length; i++) { 
            patch = [
                [lonb[ring][i],     latb[ring][0]],
                ...intermediatePoints(lonb[ring][i],lonb[ring][i-1],nSteps,latb[ring][0]),
                [lonb[ring][i-1],   latb[ring][0]],
                [lonb[ring][i-1],   latb[ring-1][0]],
                ...intermediatePoints(lonb[ring][i-1],lonb[ring][i],nSteps,latb[ring-1][0]),
                [lonb[ring][i],     latb[ring-1][0]],
                [lonb[ring][i],     latb[ring][0]]
            ];
            id = meshgeojson.length;

            meshgeojson.push(createPatch(patch, id));        
        }
    }

    // other patches

    return meshgeojson;

}




//

import * as d3 from "d3";
import * as d3geoprojection from "d3-geo-projection";
import { GUI } from 'lil-gui';


let gui;
let width, height, size, box;
let projection, geoGenerator;
let geojson;
let scalefactor;

const params = {
    patchnumber: 1000,
    projChoice: 'Equal area',
    saveSvg: () => saveSvg(),
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
    const folder_mesh = gui.addFolder( 'Mesh' );
    folder_mesh.add( params, 'patchnumber', 10, 10000, 1 ).name( 'Number of patches' ).onChange( resize );
    folder_mesh.add( params, 'projChoice', projs ).name( 'Projection' ).onChange( resize );
    folder_mesh.add( params, 'saveSvg').name( 'Save as .SVG' );

    getShape();

    setProjandgeoGene();

    makegeojson();

    update(geojson);
}
 
function getShape() {
    // create svg in div content
    d3.select("#content").append("svg").attr("id","svg").attr("width","100%").attr("height","100%");
    d3.select("#svg").append('g').attr("class","map");

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
        "features": beckersGeojsonFeature(params.patchnumber),
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
    let name = 'beckersmesh.svg';
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

init();