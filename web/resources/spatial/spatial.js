require([
    "esri/Map",
    "esri/views/MapView",
    "dojo/domReady!",
    "esri/views/2d/draw/Draw",
  	"esri/Graphic",
    "esri/geometry/Polygon",
    "esri/geometry/Point",
	"esri/symbols/PictureMarkerSymbol",
    //"esri/symbols/SimpleMarkerSymbol",
    //"esri/Color", 
    //"esri/InfoTemplate", 
    // "esri/graphic"
], function(
    Map, 
    MapView, 
    domready,
	  Draw,
	  Graphic,
    Polygon,
      //geometryEngine,
//	  webMercatorUtils,
    Point,
	PictureMarkerSymbol,
    //SimpleMarkerSymbol,
    //Color,
    //InfoTemplate
){
    //create map obj with srid 4326
    var map = new Map({
        basemap: "osm",
        spatialReference: 4326
    });

    //create MapView 
    var view = new MapView({
        container: "viewDiv",  
        map: map,  
        zoom: 20,  
        center: [12.4687279, 41.8672173]  
    });

    // for pts...
    /*var point = new Point(12.4687279, 41.8672173, map.spatialReference)
    
    var pointAtt = {
      "Xcoord": 12.4687279,
      "Ycoord": 41.8672173,
      "Plant":"Mesa Mint"};
    
    var symbol = new SimpleMarkerSymbol().setStyle(
      SimpleMarkerSymbol.STYLE_SQUARE).setColor(
      new Color([255,0,0,0.5]));
    
    var infoTemplate = new InfoTemplate("Vernal Pool Locations","Latitude: ${Ycoord} <br/>Longitude: ${Xcoord} <br/>Plant Name:${Plant}");
    
    var graphic = new Graphic(point, symbol, pointAtt, infoTemplate)

    view.graphics.add(graphic) */

    //draw polygon button for user polygon input
	  view.ui.add("draw-polygon", "top-left");
    view.when(function(event) {
        var draw = new Draw({
            view: view
        });

        //create polygon when map area clicked
        var drawPolygonButton = document.getElementById("draw-polygon");
        drawPolygonButton.addEventListener("click", function() {
            view.graphics.removeAll();
            enableCreatePolygon(draw, view);
        });

		var points = [["google HQ", "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA", 37.4224764, -122.0842499], ["School", "200 University Ave W, Waterloo, ON N2L 3G1, Canada", 43.4695172, -80.54124659999999]]

		var pictureMarkerSymbol = new PictureMarkerSymbol('/image-from-google-maps.png', 10000,10000);
		var pointexample = new PictureMarkerSymbol('http://static.arcgis.com/images/Symbols/Basic/RedStickpin.png', 20, 20);

		for (var i = 0; i < points.length; i++) {
			var pt = new Point(points[i][3],points[i][2]);
			view.graphics.add(new Graphic(pt, pointexample));
		}

      });

    //for creating polygon with user input
    function enableCreatePolygon(draw, view) {
        var action = draw.create("polygon");
        view.focus();
        action.on("vertex-add", drawPolygon);
        action.on("vertex-remove", drawPolygon);
	    action.on("cursor-update", drawPolygon);
        action.on("draw-complete", drawPolygon);
    }

    //draw polygon to show on map
    function drawPolygon(event) {
        var vertices = event.vertices;
        
        //after user is done drawing...
		    if (event.type === "draw-complete"){
            console.log(vertices)
            console.log(view.spatialReference)

            //send to Python
            
        }

	    view.graphics.removeAll();
        var polygon = createPolygon(vertices);
        var graphic = createGraphic(polygon);

        view.graphics.add(graphic);
    }
    
    //create polygon with given vertices
    function createPolygon(vertices) {
		if (event.type == "draw-complete"){
				// subi here are the stuff you need :)
				console.log(vertices)
		}
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
});
