var geojson = $.ajax({
    url: "data/data.geojson",
    dataType: "json",
    success: console.log("County data successfully loaded."),
    error: function (xhr) {
        alert(xhr.statusText)
    }
})
$.when(geojson).done(function () {

    let ori_geojson = geojson.responseJSON

    let map = L.map('map', {
        zoom: 14,
        fullscreenControl: true,
        timeDimensionControl: true,
        timeDimensionControlOptions: {
            timeSliderDragUpdate: true,
            loopButton: true,
            // autoPlay: true,
        },
        timeDimension: true,
        center: [36.72, -4.43]
    });

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

    let bounds = poly.getBounds()
    map.fitBounds(bounds)

    let buffer_coll = SequenceBuffer(ori_geojson, 12)

    let mask_buffer = MaskingBuffer(buffer_coll)

    let intersection = IntersectBufferColl(mask_buffer, ori_geojson);

    addGeoJSONLayer(map, intersection)
});

let SequenceBuffer = (geojson, iteration) => {

    let buff_coll = {
        "type": "FeatureCollection",
        "features": []
    }

    let buff_size = 100

    let deff_poly = geojson.features[1]

    for (let i = 0; i < iteration; i++) {
        let distance = buff_size * i
        let buffered = turf.buffer(deff_poly, distance, { units: 'kilometers' });

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

    for (let i = 1; i < buffer_coll.features.length; i++) {

        let first = turf.feature(buffer_coll.features[i].geometry)
        let mask = turf.feature(buffer_coll.features[i - 1].geometry)
        let masked = turf.mask(first, mask)

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

let IntersectBufferColl = (masking_buffer, ori_geojson) => {
    let forest_cover = ori_geojson.features[0]

    let intersect_coll = {
        "type": "FeatureCollection",
        "features": []
    }

    for (let i = 0; i < masking_buffer.features.length; i++) {

        let first = masking_buffer.features[i]
        let second = forest_cover
        let intersect = martinez.intersection(second.geometry.coordinates, first.geometry.coordinates)

        intersect_coll.features.push({
            "type": "Feature",
            "properties": {
                "time": new Date((2016 + i) + '/01')
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": intersect
            }
        })
    }

    return intersect_coll

}

function addGeoJSONLayer(map, data) {

    var geoJSONLayer = L.geoJSON(data).addTo(map);

    var geoJSONTDLayer = L.timeDimension.layer.geoJson(geoJSONLayer, {
        updateTimeDimension: true,
        period: 'P1Y',
        updateTimeDimensionMode: 'replace',
        waitForReady:true,
        // timeInterval: "2016-01-01/2026-12-31",
        updateCurrentTime:false,
        // addlastPoint: true
    
    });

    // Show both layers: the geoJSON layer to show the whole track
    // and the timedimension layer to show the movement of the bus
    // geoJSONLayer.addTo(map);
    map.addLayer(geoJSONTDLayer)
   
}

// let i = { "type": "Feature", "properties": { "name": "Track of bus 699", "times": ["2019-11-23 10:51:06", "2019-11-23 10:52:05", "2019-11-23 10:53:05", "2019-11-23 10:54:04", "2019-11-23 10:55:05", "2019-11-23 10:56:05", "2019-11-23 10:57:05", "2019-11-23 10:58:05", "2019-11-23 10:59:05", "2019-11-23 11:00:06", "2019-11-23 11:01:06", "2019-11-23 11:02:06", "2019-11-23 11:03:05", "2019-11-23 11:04:04", "2019-11-23 11:05:06", "2019-11-23 11:06:05", "2019-11-23 11:07:05", "2019-11-23 11:08:05", "2019-11-23 11:09:05", "2019-11-23 11:10:06", "2019-11-23 11:11:05", "2019-11-23 11:12:05", "2019-11-23 11:13:05", "2019-11-23 11:14:06", "2019-11-23 11:15:05", "2019-11-23 11:16:05", "2019-11-23 11:17:05", "2019-11-23 11:18:05", "2019-11-23 11:19:05", "2019-11-23 11:20:06", "2019-11-23 11:21:05", "2019-11-23 11:22:05", "2019-11-23 11:23:05", "2019-11-23 11:24:06", "2019-11-23 11:25:06", "2019-11-23 11:26:05", "2019-11-23 11:27:05", "2019-11-23 11:28:04", "2019-11-23 11:29:06"] }, "geometry": { "type": "LineString", "coordinates": [[-4.4214296, 36.73835], [-4.422104, 36.737865], [-4.4229302, 36.73773], [-4.4235334, 36.735817], [-4.4222927, 36.73413], [-4.4218254, 36.732475], [-4.4213734, 36.72983], [-4.420156, 36.73], [-4.419239, 36.730686], [-4.417272, 36.732136], [-4.4155564, 36.732613], [-4.4155564, 36.732613], [-4.4147606, 36.729523], [-4.4143534, 36.728085], [-4.414023, 36.727142], [-4.414023, 36.727142], [-4.4145956, 36.726017], [-4.4163203, 36.722366], [-4.4163203, 36.722366], [-4.4142747, 36.72012], [-4.4162464, 36.71957], [-4.418931, 36.71882], [-4.421059, 36.718254], [-4.421595, 36.718174], [-4.424712, 36.717197], [-4.4268923, 36.717003], [-4.427205, 36.717583], [-4.426953, 36.717876], [-4.4264026, 36.715973], [-4.4267263, 36.71531], [-4.4270782, 36.714962], [-4.4300385, 36.71217], [-4.4314194, 36.71117], [-4.4344425, 36.70879], [-4.437068, 36.706684], [-4.4393854, 36.70489], [-4.440271, 36.704346], [-4.4454684, 36.702717], [-4.4454684, 36.702717]] } }