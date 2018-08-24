require([
	"esri/Map",
	"esri/views/MapView",
	"dojo/domReady!",
	"esri/views/2d/draw/Draw",
	"esri/Graphic",
	"esri/geometry/Polygon",
	"esri/geometry/support/webMercatorUtils",
	"esri/geometry/Point",
	"esri/symbols/PictureMarkerSymbol",
	"esri/widgets/Popup",
], function (
	Map,
	MapView,
	domready,
	Draw,
	Graphic,
	Polygon,
	webMercatorUtils,
	Point,
	PictureMarkerSymbol,
	Popup,
) {
	//create map obj with srid 4326
	var map = new Map({
		basemap: "osm",
		spatialReference: 4326
	});

	//create MapView 
	var view = new MapView({
		container: "viewDiv",
		map: map,
		zoom: 5,
		center: [15.2551, 54.5260], //center of europe
		padding: {
			left: 320
		} //for side panel
	});

	//draw polygon button for user polygon input
	view.ui.add("draw-polygon", "top-left");
	pointGraphics = []
	view.when(function (event) {
		var graphic;
		var draw = new Draw({
			view: view
		});

		//create polygon when map area clicked
		var drawPolygonButton = document.getElementById("draw-polygon");
		drawPolygonButton.addEventListener("click", function () {
			view.graphics.remove(graphic);
			enableCreatePolygon(draw, view);
		});

		//event handlers for creating polygon
		function enableCreatePolygon(draw, view) {
			var action = draw.create("polygon");
			view.focus();
			action.on("vertex-add", drawPolygon);
			action.on("vertex-remove", drawPolygon);
			action.on("cursor-update", drawPolygon);
			action.on("draw-complete", drawPolygon);
		}

		//draw and show polygon on map
		function drawPolygon(event) {
			var vertices = event.vertices;

			//after user is done drawing...
			if (event.type === "draw-complete") {
				polygonCoord = [];
				for (var i = 0; i < vertices.length; i++) {
					polygonCoord.push(webMercatorUtils.xyToLngLat(
						vertices[i][0], vertices[i][1]
					));
				}
				console.log(polygonCoord);
				//send to Python
			}

			view.graphics.remove(graphic);
			var polygon = createPolygon(vertices);
			graphic = createGraphic(polygon);

			view.graphics.add(graphic);
		}
	});

	view.on("click", function (event) {
		event.stopPropagation();
		view.hitTest(event).then(function (response) {
			if (response.results.length == 1) { // might cause problems later... we'll see
				var g = response.results[0].graphic;
				for (var i = 0; i < pointGraphics.length; i++) { //make sure we hit a point
					if (g == pointGraphics[i]) {
						target = {
							target: pointGraphics[i],
							scale: 30
						}
						view.goTo(target).then(() => {
							view.popup.open({
								title: "whatever",
								location: view.center,
								content: "SUBI"
							});
						});
						break;
					}
				}
			}
		});
	});

	//create polygon with given vertices
	function createPolygon(vertices) {
		return new Polygon({
			rings: vertices,
			spatialReference: view.spatialReference
		});
	}

	//show polygon on map
	function createGraphic(polygon) {
		graphic = new Graphic({
			geometry: polygon,
			symbol: {
				type: "simple-fill",
				color: [178, 102, 234, 0.8],
				style: "solid",
				outline: {
					color: [0, 0, 0],
					width: 2
				}
			}
		});
		return graphic;
	}

	//var points = [["google HQ", "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA", 37.4224764, -122.0842499], ["School", "200 University Ave W, Waterloo, ON N2L 3G1, Canada", 43.4695172, -80.54124659999999]];
	points = [
		[70.5849449, 41.7312861],
		[9.807146399999999, 52.3770461],
		[-87.6297982, 41.8781136],
		[-4.291501999999999, 55.8754958],
		[37.5825089, 55.7082728],
		[9.8215681, 52.37683120000001],
		[7.0056135, 50.9134875],
		[9.1401293, 48.7400606],
		[7.2046449, 53.3664268],
		[139.7477457, 35.7011051],
		[11.6134751, 48.1468015],
		[8.58175, 53.21458999999999],
		[6.133899100000001, 50.7692014],
		[13.7122467, 51.034487],
		[-88.37823600000002, 42.101533],
		[-122.4194155, 37.7749295],
		[-75.3004009, 40.0021177],
		[-118.286681, 34.0395169],
		[2.2743419, 48.8245306],
		[-73.98530819999999, 40.7447986],
		[-123.1277006, 49.2267482],
		[27.821544, -26.247242],
		[9.1043363, 48.7289882],
		[8.206199999999999, 50.00292],
		[8.239760799999999, 50.0782184],
		[-87.62309669999999, 41.8190937],
		[-84.3963545, 33.7470123],
		[-122.0890647, 37.4000589],
		[-75.02596369999999, 39.4863773],
		[-118.4915863, 34.0196496],
		[-85.9766671, 41.6819935],
		[8.707303399999999, 50.1267285],
		[8.6869633, 50.1252751],
		[-77.6777061, 43.1719636],
		[6.7818162, 51.21796029999999],
		[13.352259, 52.5239282],
		[8.5617818, 50.1216887],
		[11.0753333, 49.3732908],
		[12.4687279, 41.8672173],
		[103.787209, 1.289223],
		[14.4355433, 48.4293185],
		[13.3392199, 52.5191793],
		[17.9841679, 59.3306856],
		[-1.9659039, 52.4597327],
		[8.541694, 47.3768866],
		[-0.1277583, 51.5073509],
		[13.7520736, 51.0506076],
		[-2.452274, 53.506065],
		[151.2076836, -33.8702541],
		[-2.2155178, 53.499953]
	];
	plotPoints(points);

	//for plotting points
	function plotPoints(points) {
		var ptSymbol = new PictureMarkerSymbol('http://static.arcgis.com/images/Symbols/Basic/RedStickpin.png', 20, 20);
		for (var i = 0; i < points.length; i++) {
			var pt = new Point(points[i][0], points[i][1], 4326); //Point(points[i][3],points[i][2], 4326);
			var graphic = new Graphic(pt, ptSymbol);
			pointGraphics.push(graphic);
			view.graphics.add(graphic);
		}
	}

	/*websockets
	var websocketPromise = new Promise((resolve, reject) => {
		var socket = io.connect('wss://py.hanapm.local.com:30033/geospatial');
		socket.on('open', resolve(socket));
		socket.on('error', reject());
	});

	websocketPromise.then((socket) => {
		globalSocket = socket;
		socket.on('message', (e) => {
			console.log('Received from server: ' + e);
		});
		socket.on('error', (e) => {
			console.log('Error from websocket: ' + e);
			closeWebsocket();
		});

		function closeWebsocket() {
			if (socket && socket.readyState === socket.OPEN) socket.close();
		}
	});*/
});