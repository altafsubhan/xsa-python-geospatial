import requests
import folium
import os
import logging
from cfenv import AppEnv
from hdbcli import dbapi
from cf_logging import flask_logging
from sap import xssec
from flask import *
from flask_socketio import SocketIO
from flask_socketio import send, emit, Namespace

#create instance of flask app
app = Flask(__name__)
socketio = SocketIO(app)
app_port = int(os.environ.get('PORT', 3000))

#connection with services
env = AppEnv()
hana = env.get_service(name='spatial-db')
uaa_service = env.get_service(name='myuaa').credentials

#logging
flask_logging.init(app, logging.INFO)
logger = logging.getLogger('route.logger')

#used to establish connection with HANA DB
def connectDB(serviceName):
    service = env.get_service(name=serviceName)
    conn = dbapi.connect(address=service.credentials['host'],
                         port= int(service.credentials['port']),
                         user = service.credentials['user'],
                         password = service.credentials['password'],
                         CURRENTSCHEMA=service.credentials['schema'])
    return conn

def executeQuery(conn, query, params=None, commit=False):
    logger.info(query + ' % ' + str(params))

    cursor = conn.cursor()
    cursor.execute(query, params)
    if (commit):
        conn.commit()

    response = []
    try:
        for result in cursor.fetchall():
            response.append(result)
    except dbapi.ProgrammingError:
        pass
    logger.info(response)
    
    return response

#used to check if user is authorized
def checkAuth(header):
    if 'authorization' not in request.headers:
        return False
    
    access_token = header.get('authorization')[7:]
    security_context = xssec.create_security_context(access_token, uaa_service)
    isAuthorized = security_context.check_scope('openid') or security_context.check_scope('uaa.resource')

    #logger.info("Access token: " + access_token)

    if not isAuthorized:
        return False

    return True

@app.route('/')
def hello():
    #authorize user
    logger.info('Authorization successful') if checkAuth(request.headers) else abort(403)
    
    return "Welcome to SAP HANA Spatial Demo with Python and XSA!"

#### USING FOLIUM ####
def getLatLong(addr):
    key = 'AIzaSyAp7Ad6nKFet8XBxYYh4TWFVAa3cpSMmR0'
    url = 'https://maps.googleapis.com/maps/api/geocode/json'
    try:
        r = requests.get(url + '?address=%s&key=%s' % (addr, key))
        logger.info('ADDRESS: %s' % addr)
        lat = r.json()['results'][0]['geometry']['location']['lat']
        lng = r.json()['results'][0]['geometry']['location']['lng']
        return lat, lng
    except IndexError:
        return 0, 0

@app.route('/map', methods=['GET'])
def showMap():
        logger.info('hello world')

        addr = request.args['address']
        lat, long = getLatLong(addr)
        logger.info('received input: %f, %f' % (lat, long))

        map_osm = folium.Map(location=[lat, long], zoom_start=20)
        folium.Marker([lat, long], popup=addr).add_to(map_osm)
        
        map_osm.save('./map.html')
        return send_file('./map.html')

''' Using ArcGIS '''
@app.route('/geocode', methods=['GET'])
def geocode():
    #authorize user
    logger.info('Authorization successful') if checkAuth(request.headers) else abort(403)
    
    conn = connectDB('spatial-db')
    ptType = request.args['type']
    results = []

    if (ptType == 'agencies'):
        tableName = 'STRAVELAG'
        query = '''
                SELECT "NAME", "STREET", "CITY", "COUNTRY", "POSTCODE"
                FROM %s
                ''' % tableName 
    elif (ptType == 'airports'):
        tableName = 'SAIRPORTS'
        query = '''
                SELECT NAME, LONGITUDE, LATITUDE
                FROM %s
                ''' % tableName    
                    
    for result in executeQuery(conn, query):
        if (ptType == 'agencies'):
            name = result[0]
            result = result[1:5]
            addr = ', '.join(result)
            lat, lng = getLatLong(addr)
        elif (ptType == 'airports'):
            name = result[0]
            lng = result[1]
            lat = result[2]
            
        #save to DB
        query = '''
                UPDATE %s
                SET "LOC_4326" = ST_GeomFromText('POINT(%s %s)', 4326)
                WHERE "NAME" = ?;
                ''' % (tableName, lng, lat)
                ###### SQL INJECTION ALERT

        param = name.replace("'", "''")
        executeQuery(conn, query, param, True)

        #FOR TESTING
        results.append({
            'Place': name,
            'Latitude': lat,
            'Longitude': lng
        })

    return str(results)

''' WEBSCOKET IMPLEMENTATION '''
class SpeechWsNamespace(Namespace):
    def on_connect(self):
        logger.info('Connected to client!')
        send('Connected to server!')
    
    def on_message(self, msg):
        logger.info('Received from client: %s' % msg)
    
    def on_error(self, e):
        logger.info('Error in websocket connection: %s' % e)
        self.close()

    def on_getPts(self, type):
        if (type == "travelAgents"):
            conn = connectDB('spatial-db')
            query = '''
                SELECT 
                NAME, STREET, CITY, COUNTRY,
                LOC_4326.ST_X() AS LONGITUDE,
                LOC_4326.ST_Y() AS LATITUDE
                FROM STRAVELAG
            '''

            response = []
            for result in executeQuery(conn, query):
                response.append({
                    'Name': result[0],
                    'Address': ', '.join(result[1:4]),
                    'Longitude': result[4],
                    'Latitude': result[5]
                })
            logger.info('sending: ' + str(response))
            return(response)
        elif (type == "airports"):
            query = '''
                    SELECT 
                    NAME, MUNICIPALITY, ISO_COUNTRY, LONGITUDE, LATITUDE
                    FROM SAIRPORTS
                    '''
            
            response = []
            for result in executeQuery(connectDB('spatial-db'), query):
                response.append({
                    'Name': result[0],
                    'Address': ', '.join(result[1:3]),
                    'Longitude': result[3],
                    'Latitude': result[4]
                })
            logger.info('sending: ' + str(response))
            return(response)
        else:
            return("error")

    def on_getClusters(self, options):
        if (options['type'] == 'travelAgents'):
            tableName = 'STRAVELAG'
        elif (options['type'] == 'airports'):
            tableName = 'SAIRPORTS'
        else:
            return "error"
           
        query = '''
            SELECT ST_ClusterID() AS CID, 
            COUNT(*) AS COUNT,
            ST_ClusterCentroid().ST_X() AS CENTER_LNG,
            ST_ClusterCentroid().ST_Y() AS CENTER_LAT
            FROM (
                SELECT LOC_4326.ST_Transform(1000004326) AS OBJ_LOCATION
                FROM %s
                WHERE LOC_4326 IS NOT NULL
            )
            GROUP CLUSTER BY OBJ_LOCATION 
            USING KMEANS CLUSTERS %d;
        ''' % (tableName, options['number'])

        response = []
        for result in executeQuery(connectDB('spatial-db'), query):
            response.append({
                'ClusterID': result[0],
                'Count': result[1],
                'Longitude': result[2],
                'Latitude': result[3]
            })
        logger.info('sending: ' + str(response))
        return(response)

    def on_travelAgencyNameSearch(self, input):
        query = '''
            SELECT NAME, AGENCYNUM, LOC_4326.ST_X(), LOC_4326.ST_Y()
            FROM STRAVELAG
            WHERE CONTAINS(NAME, ?, FUZZY(0.7));
        '''
        params = input.replace('\'', '\'\'')
        
        result = executeQuery(connectDB('spatial-db'), query, params)
        name = result[0][0]
        agency = result[0][1]
        lng = result[0][2]
        lat = result[0][3]

        salesQuery = '''
            SELECT SALE_DATE, SUM(TOTAL_PRICE) 
            FROM STRANSACTIONS 
            WHERE AGENCYNUM IN (%s)
            AND SALE_DATE > ADD_DAYS(CURRENT_DATE, -28)
            GROUP BY SALE_DATE
            ORDER BY SALE_DATE ASC
        ''' % (agency)

        result = executeQuery(connectDB('spatial-db'), salesQuery)
        x = [str(i[0]) for i in result]
        y = [i[1] for i in result]
        salesResponse = {'x': x, 'y': y}

        airportQuery = '''
            SELECT TOP 1 LOC_4326.ST_Distance(
                ST_GeomFromText('POINT(%s %s)', 4326), 'kilometer')
            AS DISTANCE, NAME
            FROM SAIRPORTS ORDER BY Distance ASC;	
         ''' % (lng, lat)

        result = executeQuery(connectDB('spatial-db'), airportQuery)[0]
        distanceResponse = {
            'Name': result[1],
            'Distance': result[0]
        }

        response = [name, salesResponse, distanceResponse]
        return response

    def on_polygonDrawn(self, polygonCoord):
        polygonString = 'POLYGON(('
        for coord in polygonCoord:
            polygonString += str(coord[0]) + ' ' + str(coord[1]) + ', '
        polygonString = polygonString[:-2] + '))'
        withinQuery = '''
            SELECT LOC_4326.ST_Transform(1000004326).ST_Within(
                ST_GeomFromText('%s', 4326).ST_Transform(1000004326))
            AS WITHIN, 
            NAME, LOC_4326.ST_X() AS LNG, LOC_4326.ST_Y() AS LAT, AGENCYNUM
            FROM STRAVELAG
            WHERE LOC_4326 IS NOT NULL
            ORDER BY WITHIN ASC
        ''' % polygonString

        agencyResponse = []
        agencies = []
        for result in executeQuery(connectDB('spatial-db'), withinQuery):
            if (result[0] == 1):
                agencyResponse.append({
                    "Name": result[1],
                    "Latitude": result[2],
                    "Longitude": result[3]
                })
                agencies.append(result[4])
        logger.info(agencyResponse)
        logger.info(agencies)

        salesQuery = '''
            SELECT SALE_DATE, SUM(TOTAL_PRICE) 
            FROM STRANSACTIONS 
            WHERE AGENCYNUM IN (%s)
            AND SALE_DATE > ADD_DAYS(CURRENT_DATE, -28)
            GROUP BY SALE_DATE
            ORDER BY SALE_DATE ASC
        ''' % (str(agencies)[1:-1])

        result = executeQuery(connectDB('spatial-db'), salesQuery)
        x = [str(i[0]) for i in result]
        y = [i[1] for i in result]
        salesResponse = {'x': x, 'y': y}
        logger.info(salesResponse)

        response = [agencyResponse, salesResponse]

        return response
        
socketio.on_namespace(SpeechWsNamespace('/geospatial'))

''' START APP '''
if __name__ == '__main__':
    socketio.run(app, port=app_port)