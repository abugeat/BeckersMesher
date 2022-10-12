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

    // // let rzone = new Array(nmesh).fill([0,0,0]);
    // for (let iv = 0; iv<nmesh; iv++) { // boucle sur les vecteurs en direction de chaque tuile
    //     // lat = skymesh(iv,1);
    //     // lon = skymesh(iv,2);
    //     rzone[iv] = [
    //         -Math.sin(lon[iv])*Math.sin(lat[iv]),
    //         -Math.cos(lon[iv])*Math.sin(lat[iv]),
    //         Math.cos(lat[iv])];
    // }



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

function createPatch(patches) {
    let patchjson = {
        "type": "Feature",
        "properties": {
            "name": "beckersmesh"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [patches],
        },
        "id": Math.random(),
    }; 
    return patchjson;
}

function beckersGeojsonFeature(ncell) {
    let bmesh = hemi_equi_LMTV(inc(ncell));

    let latb = bmesh[0];
    let lonb = bmesh[1];
    let patches = [];
    let meshgeojson = [];
    
    // zenith circle patch
    meshgeojson.push(createPatch(circlepolygon(latb[0][0])));

    // square patches
    for (let ring = 1; ring < latb.length; ring++) {
        // first patch
        let firstsquarepatch = [];
        firstsquarepatch.push([lonb[ring][0],    latb[ring][0]]);
        firstsquarepatch.push([-179.99,  latb[ring][0]]);
        firstsquarepatch.push([-179.99,  latb[ring-1][0]]);
        firstsquarepatch.push([lonb[ring][0],    latb[ring-1][0]]);
        firstsquarepatch.push([lonb[ring][0],    latb[ring][0]]);
        meshgeojson.push(createPatch(firstsquarepatch));
        // other patches of the ring
        let squarepatch = [];
        for (let i = 1; i < latb[ring].length; i++) { 
            squarepatch = [];
            squarepatch.push([lonb[ring][i],    latb[ring][0]]);
            squarepatch.push([lonb[ring][i-1],  latb[ring][0]]);
            squarepatch.push([lonb[ring][i-1],  latb[ring-1][0]]);
            squarepatch.push([lonb[ring][i],    latb[ring-1][0]]);
            squarepatch.push([lonb[ring][i],    latb[ring][0]]);
            meshgeojson.push(createPatch(squarepatch));        
        }
    }

    // other patches

    return meshgeojson;

}




//

import * as d3 from "d3";

let width = 300;

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

let geojson = {
    "type": "FeatureCollection",
    "features": beckersGeojsonFeature(4000),
        // {
        //     "type": "Feature",
        //     "properties": {
        //         "name": "Africa"
        //     },
        //     "geometry": {
        //         "type": "Polygon",
        //         "coordinates": [
        //             circle(10),
        //         ],
        //     },
        // },
};
  
console.log(geojson);

// let projection = d3.geoAzimuthalEqualArea()
let projection = d3.geoOrthographic()
// let projection = d3.geoAzimuthalEquidistant()
// let projection = d3.geoStereographic()
    .scale(width / 3)
    .rotate([0, -30])
    .translate([width / 2, width / 2]);
    // .clipExtent([0,0],[30,30]);
    // .translate([200, 150]);

let geoGenerator = d3.geoPath()
    .projection(projection);
  
function update(geojson) {
    let u = d3.select('#content g.map')
        .selectAll('path')
        .data(geojson.features)
        // .attr("d",)
        .enter()
        .append('path')
        .attr('d', geoGenerator)
        // .attr("fill", 'rgb(100,100,100)');
        .attr("fill", function (d) {
            return 'rgb(100,'+d.id*250+',100)';
        });
}
  
update(geojson);
/////////////////////////

// let projection = d3.geoAzimuthalEqualArea()
//     .reflectY(true)
//     .scale((width - 120) * 0.2)
//     .clipExtent([[0, 0], [width, height]])
//     .rotate([0, -90])
//     .translate([width / 2, height / 2])
//     .precision(0.1);



// const xAxis = (g) => {
//     g
//     .call(g => g.append("g")
//         .attr("stroke", "currentColor")
//     .selectAll("line")
//     .data(d3.range(360))
//     .join("line")
//         .datum(d => [
//             projection([d, 0]),
//             projection([d, d % 10 ? -1 : -2])
//         ])
//         .attr("x1", ([[x1]]) => x1)
//         .attr("x2", ([, [x2]]) => x2)
//         .attr("y1", ([[, y1]]) => y1)
//         .attr("y2", ([, [, y2]]) => y2))
//     .call(g => g.append("g")
//         .selectAll("text")
//         .data(d3.range(0, 360, 10))
//         .join("text")
//             .attr("dy", "0.35em")
//             .text(d => d === 0 ? "N" : d === 90 ? "E" : d === 180 ? "S" : d === 270 ? "W" : `${d}°`)
//             .attr("font-size", d => d % 90 ? null : 14)
//             .attr("font-weight", d => d % 90 ? null : "bold")
//             .datum(d => projection([d, -4]))
//             .attr("x", ([x]) => x)
//             .attr("y", ([, y]) => y));
// };

// const yAxis = (g) => {
//     g
//     .call(g => g.append("g")
//         .selectAll("text")
//         .data(d3.range(5, 91, 5)) // every 10°
//         .join("text")
//             .attr("dy", "0.35em")
//             .text(d => `${d}°`)
//             .datum(d => projection([180, d]))
//             .attr("x", ([x]) => x)
//             .attr("y", ([, y]) => y));
// };

// let path = d3.geoPath(projection);





// // function chart() {
// const cx = width / 2;
// const cy = height / 2;

// const svg = d3.create("svg")
//     .attr("viewBox", [0, 0, width, height])
//     .attr("font-family", "sans-serif")
//     .attr("font-size", 10)
//     .attr("text-anchor", "middle")
//     .attr("fill", "currentColor")
//     .style("margin", "0 -14px")
//     .style("display", "block");

// svg.append("path")
//     .attr("d", path(graticule))
//     .attr("fill", "none")
//     .attr("stroke", "currentColor")
//     .attr("stroke-opacity", 0.2);

// svg.append("path")
//     .attr("d", path(outline))
//     .attr("fill", "none")
//     .attr("stroke", "currentColor");

// svg.append("g")
//     .call(xAxis);

// svg.append("g")
//     .call(yAxis);

// const sunPath = svg.append("path")
//     .attr("fill", "none")
//     .attr("stroke", "red")
//     .attr("stroke-width", 2);

// const hour = svg.append("g")
//     .selectAll("g")
//     .data(d3.range(24))
//     .join("g");

// hour.append("circle")
//     .attr("fill", "black")
//     .attr("r", 2);

// hour.append("text")
//     .attr("dy", "-0.4em")
//     .attr("stroke", "white")
//     .attr("stroke-width", 4)
//     .attr("stroke-linejoin", "round")
//     .attr("fill", "none")
//     .clone(true)
//     .attr("stroke", null)
//     .attr("fill", "black");

// function update(date) {
//     const start = d3.utcHour.offset(solar.noon(date), -12);
//     const end = d3.utcHour.offset(start, 24);
//     sunPath.attr("d", path({type: "LineString", coordinates: d3.utcMinutes(start, end).map(solar.position)}));
//     hour.data(d3.utcHours(start, end));
//     hour.attr("transform", d => `translate(${projection(solar.position(d))})`);
//     hour.select("text:first-of-type").text(formatHour);
//     hour.select("text:last-of-type").text(formatHour);
// }
  
//     // return Object.assign(svg.node(), {update});
// // }

// // update = chart.update(date);

// chart.update(date);





// let projection = d3.geoAzimuthalEqualArea()
//     .reflectY(true)
//     .scale((width - 120) * 0.2)
//     .clipExtent([[0, 0], [width, height]])
//     .rotate([0, -90])
//     .translate([width / 2, height / 2])
//     .precision(0.1);

// let path = d3.geoPath(projection);

