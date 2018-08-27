require([
	"esri/Map",
	"esri/views/MapView",
	"dojo/domReady!",
	"esri/views/2d/draw/Draw",
	"esri/Graphic",
	"esri/geometry/Polygon",
	"esri/geometry/support/webMercatorUtils",
	"esri/geometry/Point",
	"esri/layers/GraphicsLayer"
], function (
	Map,
	MapView,
	domready,
	Draw,
	Graphic,
	Polygon,
	webMercatorUtils,
	Point,
	GraphicsLayer
) {
	//create map obj with srid 4326
	var map = new Map({
		basemap: "osm",
		spatialReference: 4326
	});

	//create MapView centerd at Europe
	var view = new MapView({
		container: "viewDiv",
		map: map,
		zoom: 5,
		center: [15.2551, 54.5260], //center of europe
		padding: {
			left: 320
		} //for side panel
	});

	view.on("double-click", (e) => {
		console.log(view.zoom);
	});
	view.on("mouse-wheel", (e) => {
		console.log(view.zoom);
	});

	//start websocket connection
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
	var pointGraphics = [], clusterGraphics = [];
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
			action.on("cursor-update", drawPolygon);
			action.on("draw-complete", doneDrawingPolygon);
		}

		//draw polygon on map - main function
		function drawPolygon(event) {
			view.graphics.remove(graphic);

			var polygon = createPolygon(event.vertices);
			graphic = createGraphic(polygon);

			view.graphics.add(graphic);
		}
	
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

		//use polygon
		function doneDrawingPolygon(event){
			vertices = event.vertices;
			polygonCoord = [];
			for (var i = 0; i < vertices.length; i++) {
				polygonCoord.push(webMercatorUtils.xyToLngLat(
					vertices[i][0], vertices[i][1]
				));
			}
			console.log(polygonCoord);
			//send to Python
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
		searchZoom(searchInput);		//zoom in on respective point
	}); 

	function searchZoom(input) {
		globalSocket.emit('travelAgencyNameSearch', input, response => {
			if (response !== "error") name = response;
			console.log('received after search: ' +  name + '; ' + response)
			zoomIn(name);
		});
	}

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
		for (var i = 0; i < pointGraphics.length; i++) {
			if (pointGraphics[i].attributes.Name === input || 
					input === pointGraphics[i]
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
	}
 
	//for plotting travel agencies
	var showTravelAgentsBtn = document.getElementById('showTravelAgentsBtn');
	showTravelAgentsBtn.addEventListener("click", showTravelAgents);
	function showTravelAgents() {
		globalSocket.emit('getPts', "travelAgents", pts => {
			if (pts !== "error") plotPoints(pts);
		});
	}

	//for plotting clusters
	var clustersBtn = document.getElementById('showClustersBtn');
	clustersBtn.addEventListener("click", showClusters);
	function showClusters() {
		options = {
			type: "travelAgents",
			number: view.zoom + 5
		}
		globalSocket.emit('getClusters', options, pts => {
			if (pts !== "error") plotPoints(pts, true);
		})
	}

	//show points on the map
	function plotPoints(points, cluster=false) {
		map.removeAll();
		if (cluster) {
			var picBaseUrl = "https://static.arcgis.com/images/Symbols/Shapes/";
			for (var i = 0; i < points.length; i++) {
				var count = points[i].Count;
				var source = count > 5 ? "images/cluster_marker_red.png" : "images/cluster_marker_yellow.png";
				var ptSymbol = {
					type: "picture-marker",
					url: source,
					width: "30px",
					height: "30px"	
				}
				var textSymbol = {
					type: "text", 
					color: "black", 
					text: count,
					verticalAlignment: "middle"
				}
				var pt = new Point(points[i].Longitude, points[i].Latitude, 4326);
				var attr = {
					ClusterID: points[i].ClusterID
				}
				var textGraphic = new Graphic(pt, textSymbol);
				var picGraphic = new Graphic(pt, ptSymbol, attr);
				clusterGraphics.push(picGraphic);
				clusterGraphics.push(textGraphic);
			}
			var clusterLayer = new GraphicsLayer({
				graphics: clusterGraphics
			});
			map.add(clusterLayer);
		} else {
			var ptSymbol = {
				type: "picture-marker",
				url: "images/marker.png",
				width: 20,
				height: 20
			}
			for (var i = 0; i < points.length; i++) {
				var pt = new Point(points[i].Longitude, points[i].Latitude, 4326);
				var attr = {
					Name: points[i].Name,
					Address: points[i].Address
				}
				var graphic = new Graphic(pt, ptSymbol, attr);
				pointGraphics.push(graphic);		
			}
			var ptsLayer = new GraphicsLayer({
				graphics: pointGraphics
			});
			map.add(ptsLayer);
		}
	}
});