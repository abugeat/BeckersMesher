console.log("hellooooo");

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

// function [skymesh, rzone, lati_b_cell]=Hemi_equi_LMTV(nucel)

function hemi_equi_LMTV(nucel) {
    
    let nan = nucel.length;          // number of sky rings
    let lat = new Array(nucel[nan-1]).fill(0);          // patch latitud
    let lon = new Array(nucel[nan-1]).fill(0);          // patch longitud 
    let rzone=new Array(nucel[nan-1]).fill([0,0,0]);    // patch direction 
    
    // tracé des segments de méridiens
    let vr = new Array(nan).fill(1); // ones(nan,1);
    for (let i=1; i<nan; i++) {
        vr[i] = vr[i-1]*Math.sqrt(nucel[i]/nucel[i-1]);
    }

    // vr = vr/vr(nan); // need .map!
    vr = vr.map(x => x/vr[nan-1]);
    console.log(vr); 
    
    // hauteur = zeros(nan,1);
    // dis = ones(nan,1);
    // lati_b_cell = zeros(nan,1);
    // lati_cell = zeros(nan,1);
    
    // for i=1:nan;
    //     hauteur(i)=sqrt((1-vr(i)^2)^2/(2-vr(i)^2)); 
    //     dis(i)=sqrt(hauteur(i)^2+vr(i)^2);
    //     lati_b_cell(i)=(acos(vr(i)/dis(i)));
    // // end
    
    // lati_cell(1)=0; 
    // for i=1:nan-1;
    //     lati_cell(i+1)=(lati_b_cell(i)+lati_b_cell(i+1))/2;
    // // end
    
    // ipoi=1;
    // for i=1:nan-1;
    //     nmerid=nucel(i+1)-nucel(i); // nombre de cellules dans 1 anneau
    //     longi = -pi/nmerid;
    //     for j=1:nmerid;
    //         ipoi=ipoi+1;
    //         lat(ipoi)=lati_cell(i+1);
    //         longi=longi+2*pi/nmerid;
    //         lon(ipoi)=longi;
    //     // end;
    // // end;
    
    // // Affichage des latitudes et longitudes des cellules en radians
    // nmesh=size(lat,1);
    // AS = ones(nmesh,1)*(2*pi/nmesh); //Angle solide de chaque maille (supposé égaux)
    // lat=pi/2-lat; lat(1)=0;
    // skymesh=[lat lon AS];
    
    // for iv=1:nmesh // boucle sur les vecteurs en direction de chaque tuile
    //     lat = skymesh(iv,1);
    //     lon = skymesh(iv,2);
    //     vect = [-sin(lon)*sin(lat)  -cos(lon)*sin(lat)  cos(lat)];
    //     rzone(iv,:) = vect;
    // // end
        
} 



console.log(inc(200));
console.log(hemi_equi_LMTV(inc(200)));