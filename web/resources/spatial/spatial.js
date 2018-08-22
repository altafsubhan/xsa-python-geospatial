require([
    "esri/Map",
    "esri/views/MapView",
    "dojo/domReady!",
    "esri/views/2d/draw/Draw",
	"esri/Graphic",
    "esri/geometry/Polygon",
    "esri/geometry/geometryEngine",
    "esri/geometry/Point",
    //"esri/symbols/SimpleMarkerSymbol",
    //"esri/Color", 
    //"esri/InfoTemplate", 
   // "esri/graphic"
  ], function(
    Map, 
    MapView, 
    domready,// Graphic,
	Draw,
	Graphic,
      Polygon,
      geometryEngine,
//	  webMercatorUtils,
    Point,
    //SimpleMarkerSymbol,
    //Color,
    //InfoTemplate
	){
    var map = new Map({
      basemap: "hybrid",
      spatialReference: 4326
    });
    var view = new MapView({
      container: "viewDiv",  // Reference to the scene div created in step 5
      map: map,  // Reference to the map object created before the scene
      zoom: 12,  // Sets zoom level based on level of detail (LOD)
      center: [12.4687279, 41.8672173]  // Sets center point of view using longitude,latitude
    });

    //var point = new Point(12.4687279, 41.8672173, map.spatialReference)
    
    /*var pointAtt = {
      "Xcoord": 12.4687279,
      "Ycoord": 41.8672173,
      "Plant":"Mesa Mint"};
    
    var symbol = new SimpleMarkerSymbol().setStyle(
      SimpleMarkerSymbol.STYLE_SQUARE).setColor(
      new Color([255,0,0,0.5]));
    
    var infoTemplate = new InfoTemplate("Vernal Pool Locations","Latitude: ${Ycoord} <br/>Longitude: ${Xcoord} <br/>Plant Name:${Plant}");
    
    var graphic = new Graphic(point, symbol, pointAtt, infoTemplate)

    view.graphics.add(graphic) */

	 view.ui.add("draw-polygon", "top-left");
      view.when(function(event) {
	  console.log(view)
        var draw = new Draw({
          view: view
        });
		console.log(4654654)

        var drawPolygonButton = document.getElementById("draw-polygon");
		console.log(drawPolygonButton)
        drawPolygonButton.addEventListener("click", function() {
          view.graphics.removeAll();
          enableCreatePolygon(draw, view);
        });
      });

      function enableCreatePolygon(draw, view) {
        var action = draw.create("polygon");
        view.focus();
        action.on("vertex-add", drawPolygon);
        action.on("vertex-remove", drawPolygon);
	    action.on("cursor-update", drawPolygon);
        action.on("draw-complete", drawPolygon);
      }

      function drawPolygon(event) {
        var vertices = event.vertices;
		 if (event.type == "draw-complete"){
				// subi here are the stuff you need :)

		console.log(vertices)
}
		view.graphics.removeAll();

        var polygon = createPolygon(vertices);

        var graphic = createGraphic(polygon);
        view.graphics.add(graphic);
	/*	if (event.type == "draw-complete"){
			console.log(polygon)
			for (var i = 0; i < vertices.length; i++) {
				var pt = new Point(i, view.spatialReference);
				console.log((pt.latitude) + " " + (pt.longtitude))
			}
		}
      */
}
      function createPolygon(vertices) {
        return new Polygon({
          rings: vertices,
          spatialReference: view.spatialReference
        });
      }

function createGraphic(polygon) {
        graphic = new Graphic({
          geometry: polygon,
          symbol: {
            type: "simple-fill", // autocasts as SimpleFillSymbol
            color: [178, 102, 234, 0.8],
            style: "solid",
            outline: { // autocasts as SimpleLineSymbol
              color: [255, 255, 255],
              width: 2
            }
          }
        });
        return graphic;
      }
  });
