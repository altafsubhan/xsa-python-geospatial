require([
    "esri/Map",
    "esri/views/MapView",
    "dojo/domReady!",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/Color", 
    "esri/InfoTemplate", 
    "esri/graphic"
  ], function(
    Map, 
    MapView, 
    Graphic,
    Point,
    SimpleMarkerSymbol,
    Color,
    InfoTemplate){
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
    
    var point = new Point(12.4687279, 41.8672173, map.spatialReference)
    
    var pointAtt = {
      "Xcoord": 12.4687279,
      "Ycoord": 41.8672173,
      "Plant":"Mesa Mint"};
    
    var symbol = new SimpleMarkerSymbol().setStyle(
      SimpleMarkerSymbol.STYLE_SQUARE).setColor(
      new Color([255,0,0,0.5]));
    
    var infoTemplate = new InfoTemplate("Vernal Pool Locations","Latitude: ${Ycoord} <br/>Longitude: ${Xcoord} <br/>Plant Name:${Plant}");
    
    var graphic = new Graphic(point, symbol, pointAtt, infoTemplate)

    view.graphics.add(graphic)
  });
