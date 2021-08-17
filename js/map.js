var geojson = $.ajax({
    url: "data/data.geojson",
    dataType: "json",
    success: console.log("County data successfully loaded."),
    error: function(xhr) {
        alert(xhr.statusText)
    }
})
$.when(geojson).done(function() {

    let ori_geojson = geojson.responseJSON

    let map = L.map('map').setView([39.74739, -105], 13);

	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox/light-v9',
		tileSize: 512,
		zoomOffset: -1
	}).addTo(map);

    // Add requested external GeoJSON to map
    let poly = L.geoJSON(ori_geojson)
    // poly.addTo(map);
    
    let bounds = poly.getBounds()
    map.fitBounds(bounds)

    let buffer_coll = SequenceBuffer(ori_geojson,12)
    
    L.geoJSON(buffer_coll)
    
    let mask_buffer = MaskingBuffer(buffer_coll)
    // console.log(mask_buffer)
    // L.geoJSON(mask_buffer.features[3]).addTo(map)

    let first = turf.polygon(mask_buffer.features[1].geometry.coordinates)
    L.geoJSON(first).addTo(map)
    let second = turf.polygon(ori_geojson.features[0].geometry.coordinates)

    L.geoJSON(second).addTo(map)

    let intersection = turf.intersect(first,second);
    console.log(intersection)
    L.geoJSON(intersection).addTo(map)

});

let SequenceBuffer = (geojson, iteration) => {

    let buff_coll = {
        "type": "FeatureCollection",
        "features": []
    }

    let buff_size = 100

    let deff_poly = geojson.features[1]

    for(let i = 0; i < iteration; i++) {
        let distance = buff_size * i
        let buffered = turf.buffer(deff_poly, distance, {units: 'kilometers'});

        buff_coll.features.push({
            "type": "Feature",
            "properties": {
                "year": 2016 + i
            },
            "geometry": buffered.geometry,
        })

    }

    return buff_coll
}

let MaskingBuffer = (buffer_coll) => {

    let mask_coll = {
        "type": "FeatureCollection",
        "features": [buffer_coll.features[0]]
    }

    for(let i = 1; i < buffer_coll.features.length; i++) {

        let first = turf.feature(buffer_coll.features[i].geometry)
        let mask = turf.feature(buffer_coll.features[i - 1].geometry)
        let masked = turf.mask(first,mask)
        
        mask_coll.features.push({
            "type": "Feature",
            "properties": {
                "year": 2016 + i
            },
            "geometry": masked.geometry,
        })

    }

    return mask_coll

}

let IntersectBufferColl = (masking_buffer,ori_geojson) => {
    let forest_cover = ori_geojson.features[0]
  
    let intersect_coll = {
        "type": "FeatureCollection",
        "features": []
    }
    
    let x = []
    for(let i = 0; i < masking_buffer.features.length; i++) {
        console.log(masking_buffer.features[i])
        let first = turf.feature(masking_buffer.features[i].geometry)
        
        let second = turf.feature(forest_cover.geometry)

        let intersection = turf.intersect(first, second);
        x.push(intersection)
        

        // intersect_coll.features.push({
        //     "type": "Feature",
        //     "properties": {
        //         "year": 2016 + i
        //     },
        //     "geometry": intersection.geometry,
        // })

    }
    console.log(x)
    return x

}