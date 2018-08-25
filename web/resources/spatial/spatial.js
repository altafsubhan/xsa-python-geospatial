require([
	"esri/Map",
	"esri/views/MapView",
	"dojo/domReady!",
	"esri/views/2d/draw/Draw",
	"esri/Graphic",
	"esri/geometry/Polygon",
	"esri/geometry/support/webMercatorUtils",
	"esri/geometry/Point",
	"esri/symbols/PictureMarkerSymbol"
], function (
	Map,
	MapView,
	domready,
	Draw,
	Graphic,
	Polygon,
	webMercatorUtils,
	Point,
	PictureMarkerSymbol
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

	//websockets
	var websocketPromise = new Promise((resolve, reject) => {
		var socket = io.connect('wss://py.hanapm.local.com:30033/geospatial');
		socket.on('open', resolve(socket));
		socket.on('error', reject());
	});

	websocketPromise.then((socket) => {
		globalSocket = socket;
		socket.on('message', e => {
			console.log('Received from server: ' + e);
		});
		socket.on('error', e => {
			console.log('Error from websocket: ' + e);
			closeWebsocket();
		});

		function closeWebsocket() {
			if (socket && socket.readyState === socket.OPEN) socket.close();
		}
	});

	//draw polygon button for user polygon input
	view.ui.add("draw-polygon", "top-left");
	var pointGraphics = []
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
		}
	});

	//search
	var searchSubmitBtn = document.getElementById('searchSubmit');
	var searchField = document.getElementById('searchField');
	searchField.addEventListener("keyup", event => {
		if (event.key !== "Enter") return;
		searchSubmitBtn.click();
		event.preventDefault();
	});
	searchSubmitBtn.addEventListener("click", () => {
		searchInput = searchField.value;
		if (view.graphics.length < 1) showTravelAgents();
		zoomIn(searchInput);		//zoom in on respective point
	}); 

	//for zooming in on the clicked point
	view.on("click", function (event) {
		event.stopPropagation();	//required
		view.hitTest(event).then(function (response) {
			if (response.results.length === 1) { // might cause problems later... we'll see
				var g = response.results[0].graphic;
				zoomIn(g);
			}
		});
	});

	//actual zoom in function
	function zoomIn(input) {
		if (typeof(input) === 'string') {
			
		}
		for (var i = 0; i < pointGraphics.length; i++) {
			if (
				(typeof(input) === 'string' && 
					findNameMatch(input)) ||
					//pointGraphics[i].attributes.Name === input) || 
				(typeof(input) === 'object' && 
					input === pointGraphics[i])
			) {
				target = {
					target: pointGraphics[i],
					zoom: 30
				}
				options = {
					animate: true,
					duration: 1500,
					easing: 'linear'
				}
				view.goTo(target, options).then(() => {
					var title = target.target.attributes.Name;
					var addr = target.target.attributes.Address;
					view.popup.open({
						title: title,
						location: {
							longitude: view.center.longitude, 
							latitude: view.center.latitude + 0.00002
						},
						content: addr
					});
				});
				break;
			}
		}
		function findNameMatch(name) {
			globalSocket.emit('travelAgencyNameSearch', name, )
		}
	}
 
	//for plotting points
	var showTravelAgentsBtn = document.getElementById('showTravelAgentsBtn');
	showTravelAgentsBtn.addEventListener("click", showTravelAgents);
	function showTravelAgents() {
		console.log('sending request')
		globalSocket.emit('getPts', "travelAgents", pts => {
			console.log('received back: ' + pts)
			if (pts !== "error") plotPoints(pts);
		});
	}

	/*points = [
		["Ali's Bazar", '45, Mac Arthur Boulevard', 'Boston', 'US', -71.0599532, 42.35728160000001],
		["Up 'n' Away", 'Nackenbergerstr. 92', 'Hannover', 'DE', 9.807146399999999, 52.3770461],
		['Super Agency', '50 Cranworth St', 'Glasgow', 'GB', -4.291501999999999, 55.8754958],
		["Hendrik's", '1200 Industrial Drive', 'Chicago', 'US', -87.6297982, 41.8781136],
		['Wang Chong', 'Gagarine Park', 'Moscow', 'RU', 37.6172999, 55.755826],
		['Around the World', 'An der Breiten Wiese 122', 'Hannover', 'DE', 9.8215681, 52.37683120000001],
		['No Return', 'Wahnheider Str. 57', 'Koeln', 'DE', 7.0056135, 50.9134875],
		['Special Agency Peru', 'Triberger Str. 42', 'Stuttgart', 'DE', 9.1401293, 48.7400606],
		['Caribian Dreams', 'Deichstrasse 45', 'Emden', 'DE', 7.2046449, 53.3664268],
		['Asia By Plane', '6-9 Iidabashi 7-chome', 'Tokyo', 'JP', 139.7477457, 35.7011051],
		['Everywhere', 'Regensburger Platz 23', 'Muenchen', 'DE', 11.6134751, 48.1468015],
		['Happy Holiday', 'Rastenburger Str. 12', 'Bremen', 'DE', 8.58175, 53.21458999999999],
		['No Name', 'Schwalbenweg 43', 'Aachen', 'DE', 6.133899100000001, 50.7692014],
		['Fly Low', 'Chemnitzer Str. 42', 'Dresden', 'DE', 13.7122467, 51.034487],
		['Trans World Travel', '100 Industrial Drive', 'Chicago', 'US', -88.37823600000002, 42.101533],
		['Bright Side of Life', '340 State Street', 'San Francisco', 'US', -122.3948962, 37.793992],
		['Sunny, Sunny, Sunny', '1300 State Street', 'Philadelphia', 'US', -75.3004009, 40.0021177],
		['Supercheap', '1400, Washington Circle', 'Los Angeles', 'US', -118.286681, 34.0395169],
		['Hitchhiker', '21 Rue de Moselle', 'Issy-les-Moulineaux', 'FR', 2.2781667, 48.8261456],
		['Fly Now, Pay Later', '100 Madison', 'New York', 'US', -73.98530819999999, 40.7447986],
		['Real Weird Vacation', '949 5th Street', 'Vancouver', 'CA', -123.1277006, 49.2267482],
		['Cap Travels Ltd.', '10 Mandela St', 'Johannesburg', 'ZA', 27.821544, -26.247242],
		['Rainy, Stormy, Cloudy', 'Lindenstr. 462', 'Stuttgart', 'DE', 9.1043363, 48.7289882],
		['Women only', 'Kirchstr. 53', 'Mainz', 'DE', 8.206199999999999, 50.00292],
		['Maxitrip', 'Flugfeld 17', 'Wiesbaden', 'DE', 8.239760799999999, 50.0782184],
		['Intertravel', 'Michigan Ave', 'Chicago', 'US', -87.62309669999999, 41.8190937],
		['Ultimate Goal', '300 Peach tree street Sou', 'Atlanta', 'US', -84.387878, 33.76256],
		['Submit and Return', '20890 East Central Ave', 'Palo Alto', 'US', -122.0890647, 37.4000589],
		['All British Air Planes', '224 Tomato Lane', 'Vineland', 'US', -75.02596369999999, 39.4863773],
		['Rocky Horror Tours', '789 Santa Monica Blvd.', 'Santa Monica', 'US', -118.4915863, 34.0196496],
		['Miles and More', '777 Arlington Blvd.', 'Elkhart', 'US', -85.9766671, 41.6819935],
		['Not Only By Bike', 'Saalburgstr. 765', 'Frankfurt', 'DE', 8.707303399999999, 50.1267285],
		['Fly & Smile', 'Zeppelinstr. 17', 'Frankfurt', 'DE', 8.6869633, 50.1252751],
		['Sunshine Travel', '134 West Street', 'Rochester', 'US', -77.6777061, 43.1719636],
		['Fly High', 'Berliner Allee 11', 'Duesseldorf', 'DE', 6.7818162, 51.21796029999999],
		['Happy Hopping', 'Calvinstr. 36', 'Berlin', 'DE', 13.352259, 52.5239282],
		['Pink Panther', 'Auf der Schanz 54', 'Frankfurt', 'DE', 8.5617818, 50.1216887],
		['Your Choice', 'Gustav-Jung-Str. 425', 'Nuernberg', 'DE', 11.0753333, 49.3732908],
		['Bella Italia', 'Via Marconi 123', 'Roma', 'IT', 12.4687279, 41.8672173],
		['Burns Nuclear', '14 Science Park Drive', 'Singapore', 'SG', 103.787209, 1.289223],
		['Honauer Reisen GmbH', 'Baumgarten 8', 'Neumarkt', 'AT', 14.4355433, 48.4293185],
		['Travel from Walldorf', 'Altonaer Str. 24', 'Berlin', 'DE', 13.3392199, 52.5191793],
		['Voyager Enterprises', 'Gustavslundsvaegen 151', 'Stockholm', 'SE', 17.9841679, 59.3306856],
		['Ben McCloskey Ltd.', '74 Court Oak Rd', 'Birmingham', 'GB', -1.9659039, 52.4597327],
		['Pillepalle Trips', 'Gorki Park 4', 'Zuerich', 'CH', 8.541694, 47.3768866],
		['Kangeroos', '5 Lancaster drive', 'London', 'GB', -0.1687056, 51.5468597],
		['Bavarian Castle', 'Pilnizerstr. 241', 'Dresden', 'DE', 13.8471116, 51.0283779],
		['The Ultimate Answer', '20 Avon Rd', 'Manchester', 'GB', -2.1988397, 53.4321092],
		['Hot Socks Travel', '450 George St', 'Sydney', 'AU', 151.2076836, -33.8702541],
		['Aussie Travel', '150 Queens Rd', 'Manchester', 'GB', -2.2155178, 53.4999536]
	];
	plotPoints(points);*/

	function plotPoints(points) {
		var ptSymbol = new PictureMarkerSymbol('images/marker.png', 20, 20);
		for (var i = 0; i < points.length; i++) {
			var pt = new Point(points[i][4], points[i][5], 4326); //Point(points[i][3],points[i][2], 4326);
			var attr = {
				Name: points[i][0],
				Address: points[i][1] + ', ' + points[i][2] + ', ' + points[i][3]
			}
			var graphic = new Graphic(pt, ptSymbol, attr);
			pointGraphics.push(graphic);
			view.graphics.add(graphic);
		}
	}
});