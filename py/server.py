import requests
import folium
import os
import logging
from cfenv import AppEnv
from hdbcli import dbapi
from cf_logging import flask_logging
from sap import xssec
from flask import *

#create instance of flask app
app = Flask(__name__)
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
    logger.info(query)

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
        #logger.info(r.json())
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

#### Using ArcGIS ####
@app.route('/geocode', methods=['GET'])
def startGIS():
    #authorize user
    logger.info('Authorization successful') if checkAuth(request.headers) else abort(403)
    
    conn = connectDB('spatial-db')
    query = '''
            SELECT "NAME", "STREET", "CITY", "COUNTRY", "POSTCODE"
            FROM STRAVELAG
            '''
    
    results = []
    for result in executeQuery(conn, query):
        name = result[0]
        result = result[1:5]
        addr = ', '.join(result)
        lat, lng = getLatLong(addr)

        #save to DB
        query = '''
                UPDATE "STRAVELAG"
                SET "LOC_4326" = ST_GeomFromText('POINT(%s %s)', 4326)
                WHERE "NAME" = '%s';
                ''' % (lng, lat, name.replace("'", "''"))

        executeQuery(conn, query, None, True)

        #FOR TESTING
        point = {'Agency': name,
                 'Latitude': lat,
                 'Longitude': lng}
        results.append(point)

    return str(results)

@app.route('/getPoints', methods=['GET'])
def getPoints():
    conn = connectDB('spatial-db')
    query = 'SELECT "NAME", "LOC_4326" FROM STRAVELAG'
    results = executeQuery(conn, query)

    for result in results:

if __name__ == '__main__':
    app.run(port=app_port)