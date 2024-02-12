$(document).ready(function () {
    mapboxgl.accessToken = 'pk.eyJ1IjoicGF3bi10by1raW5nIiwiYSI6ImNscm4xZWNycDAwbHUyam1pYXFwY2w5YjEifQ.biJBx5TRtjS2oRyZJhOHSQ';

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [0, 0],
        zoom: 1
    });

    $('#search-form').submit(function (event) {
        event.preventDefault();
        const city = $('#search').val();

        $.post('/weather', { city }, function (data) {
            if (data.weather && data.weather.coord) {
                const lat = data.weather.coord.lat;
                const lon = data.weather.coord.lon;

                if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
                    map.setZoom(7);
                    map.setCenter([lon, lat]);
                    new mapboxgl.Marker().setLngLat([lon, lat]).addTo(map);
                }
            }
        });
    });
});
