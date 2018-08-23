require([
    "esri/Map",
    "esri/views/MapView",
    "dojo/domReady!",
    "esri/views/2d/draw/Draw",
  	"esri/Graphic",
    "esri/geometry/Polygon",
    "esri/geometry/Point",
    //"esri/symbols/SimpleMarkerSymbol",    //for plotting points...
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
    //Point,    //for plotting pts...
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
