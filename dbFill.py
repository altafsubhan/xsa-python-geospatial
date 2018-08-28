import random

header = 'TRANSACTION_ID,AGENCYNUM,SALE_DATE,AIRPORT_FROM,AIRPORT_TO,TOTAL_PRICE\n'

# transaction id -> ####
# agencynum -> 1/50 options
# date -> aug 1 to aug 27, 2018 -> YYYY-MM-DD
# airport_from -> 1/600 options
# airport_to -> 1/600 option - airport_from
# total_price -> $500 to $4000

# row = (id, agency, date, a_from, a_to, price)

agencies_list = ['00000111', '00000124', '00000112', '00000310', '00000113', '00000114', '00000115', '00000116', '00000117', '00000118', '00000119', '00000120', '00000121', '00000122', '00000125', '00000130', '00000152', '00000222', '00000224', '00000229', '00000233', '00000254', '00000284', '00000291', '00000294', '00000297', '00000301', '00000304', '00000319', '00000320', '00000323', '00000325', '00000188', '00000055', '00000061', '00000087', '00000093', '00000100', '00000101', '00000103', '00000104', '00000105', '00000106', '00000107', '00000108', '00000109', '00000110', '00000295', '00000102', '00000123']
airports_list = ['PPE', 'POM', 'KEF', 'PRN', 'YEG', 'YHZ', 'YOW', 'YUL', 'YVR', 'YWG', 'YYC', 'YYJ', 'YYT', 'YYZ', 'ALG', 'ACC', 'ABV', 'QUO', 'KAN', 'LOS', 'TUN', 'BRU', 'CRL', 'LGG', 'SXF', 'DRS', 'FRA', 'FMO', 'HAM', 'CGN', 'DUS', 'MUC', 'NUE', 'LEJ', 'STR', 'TXL', 'HAJ', 'BRE', 'DTM', 'FKB', 'TLL', 'HEL', 'BFS', 'BHD', 'BHX', 'DSA', 'CWL', 'BRS', 'LPL', 'LTN', 'BOH', 'SOU', 'LGW', 'LHR', 'LBA', 'NCL', 'EMA', 'ABZ', 'GLA', 'EDI', 'NWI', 'STN', 'EXT', 'LKZ', 'MHZ', 'FFD', 'BZZ', 'AMS', 'MST', 'EIN', 'ORK', 'DUB', 'SNN', 'BLL', 'CPH', 'AAL', 'LUX', 'BOO', 'BGO', 'OSL', 'TOS', 'TRD', 'SVG', 'GDN', 'KRK', 'KTW', 'WMI', 'POZ', 'WAW', 'WRO', 'GOT', 'MMX', 'LLA', 'ARN', 'RMS', 'RIX', 'VNO', 'CPT', 'GRJ', 'DUR', 'JNB', 'JNB', 'RRG', 'LUN', 'LPA', 'TFS', 'TFN', 'CMN', 'DSS', 'DKR', 'NKC', 'ADD', 'CAI', 'HRG', 'LXR', 'NBO', 'MBA', 'TIP', 'JUB', 'KRT', 'DAR', 'ABQ', 'ADW', 'AFW', 'AGS', 'AMA', 'ATL', 'AUS', 'AVL', 'BAB', 'BAD', 'BDL', 'BFI', 'BGR', 'BHM', 'BIL', 'BLV', 'BMI', 'BNA', 'BOI', 'BOS', 'BTR', 'BUF', 'BWI', 'CAE', 'CBM', 'CHA', 'CHS', 'CID', 'CLE', 'CLT', 'CMH', 'COS', 'CPR', 'CRP', 'CRW', 'CVG', 'CVS', 'DAB', 'DAL', 'DAY', 'DBQ', 'DCA', 'DEN', 'DFW', 'DLF', 'DLH', 'DOV', 'DSM', 'DTW', 'DYS', 'EDW', 'END', 'ERI', 'EWR', 'FFO', 'FLL', 'FSM', 'FTW', 'FWA', 'GEG', 'GPT', 'GRB', 'GSB', 'GSO', 'GSP', 'GUS', 'HIB', 'HMN', 'HOU', 'HSV', 'HTS', 'IAD', 'IAH', 'ICT', 'IND', 'JAN', 'JAX', 'JFK', 'JLN', 'LAS', 'LAX', 'LBB', 'LCK', 'LEX', 'LFI', 'LFT', 'LGA', 'LIT', 'LTS', 'LUF', 'MBS', 'MCF', 'MCI', 'MCO', 'MDW', 'MEM', 'MGE', 'MGM', 'MAN', 'MHT', 'MIA', 'MKE', 'MLI', 'MLU', 'MOB', 'MSN', 'MSP', 'MSY', 'MUO', 'OAK', 'OKC', 'ONT', 'ORD', 'ORF', 'PAM', 'PBI', 'PDX', 'PHF', 'PHL', 'PHX', 'PIA', 'PIT', 'PWM', 'RDU', 'RFD', 'RIC', 'RND', 'RNO', 'ROA', 'ROC', 'RST', 'RSW', 'SAN', 'SAT', 'SAV', 'SBN', 'SDF', 'SEA', 'SFB', 'SFO', 'SGF', 'SHV', 'SJC', 'SKA', 'SLC', 'SMF', 'SNA', 'SPI', 'SPS', 'SRQ', 'SSC', 'STL', 'SUS', 'SUU', 'SUX', 'SYR', 'SZL', 'TCM', 'TIK', 'TLH', 'TOL', 'TPA', 'TRI', 'TUL', 'TUS', 'TYS', 'VBG', 'VPS', 'WRB', 'TIA', 'BOJ', 'SOF', 'VAR', 'LCA', 'PFO', 'AKT', 'ZAG', 'ALC', 'BCN', 'MAD', 'AGP', 'PMI', 'SCQ', 'BOD', 'TLS', 'LYS', 'MRS', 'NCE', 'CDG', 'ORY', 'BSL', 'ATH', 'HER', 'SKG', 'BUD', 'BRI', 'CTA', 'PMO', 'CAG', 'MXP', 'BGY', 'TRN', 'GOA', 'LIN', 'BLQ', 'TSF', 'VRN', 'VCE', 'CIA', 'FCO', 'NAP', 'PSA', 'LJU', 'PRG', 'TLV', 'VDA', 'MLA', 'VIE', 'FAO', 'TER', 'PDL', 'OPO', 'LIS', 'SJJ', 'OTP', 'GVA', 'ZRH', 'ESB', 'ADA', 'AYT', 'GZT', 'IAT', 'ADB', 'DLM', 'ERZ', 'TZX', 'ISE', 'BJV', 'SAW', 'BEG', 'TGD', 'BTS', 'PUJ', 'SDQ', 'KIN', 'ACA', 'GDL', 'HMO', 'MEX', 'MTY', 'PVR', 'SJD', 'TIJ', 'CUN', 'PTY', 'LIR', 'SAL', 'HAV', 'VRA', 'GCM', 'NAS', 'BZE', 'RAR', 'AKL', 'CHC', 'WLG', 'BAH', 'DMM', 'JED', 'MED', 'RUH', 'IKA', 'THR', 'MHD', 'SYZ', 'TBZ', 'AMM', 'KWI', 'BEY', 'DQM', 'MNH', 'AUH', 'DXB', 'DWC', 'SHJ', 'MCT', 'ISB', 'SKT', 'BGW', 'BSR', 'ALP', 'DAM', 'LTK', 'FAI', 'ANC', 'GUM', 'CGY', 'HNL', 'ISB', 'DOH', 'KNH', 'KHH', 'TPE', 'NRT', 'KIX', 'CTS', 'FUK', 'KOJ', 'NGO', 'FSZ', 'ITM', 'HND', 'OKO', 'MWX', 'KUV', 'CJU', 'PUS', 'ICN', 'GMP', 'CJJ', 'OKA', 'CRK', 'MNL', 'DVO', 'CEB', 'GRV', 'EZE', 'BEL', 'BSB', 'CNF', 'CWB', 'FLN', 'GIG', 'GRU', 'NAT', 'CGH', 'SSA', 'SCL', 'LTX', 'UIO', 'BOG', 'LIM', 'CUZ', 'MVD', 'BLA', 'CCS', 'PTP', 'SJU', 'NBE', 'SXM', 'ALA', 'TSE', 'FRU', 'KGF', 'GYD', 'EVN', 'TBS', 'KHV', 'KBP', 'SIP', 'HRK', 'ODS', 'LED', 'MSQ', 'KJA', 'OVB', 'ROV', 'AER', 'SVX', 'TAS', 'ZIA', 'DME', 'SVO', 'VKO', 'KZN', 'UFA', 'KUF', 'BOM', 'GOI', 'CMB', 'PNH', 'REP', 'CCU', 'HKG', 'ATQ', 'DEL', 'MFM', 'BLR', 'COK', 'CCJ', 'HYD', 'MAA', 'TRV', 'MLE', 'DMK', 'BKK', 'CNX', 'HKT', 'DAD', 'HAN', 'SGN', 'MDL', 'RGN', 'UPG', 'DPS', 'SUB', 'SOQ', 'BWN', 'CGK', 'KUL', 'SIN', 'BNE', 'MEL', 'ADL', 'PER', 'CBR', 'SYD', 'PEK', 'HET', 'NAY', 'TSN', 'TYN', 'CAN', 'CSX', 'KWL', 'NNG', 'SZX', 'CGO', 'WUH', 'HAK', 'SYX', 'XIY', 'KMG', 'XMN', 'FOC', 'HGH', 'TNA', 'NGB', 'NKG', 'PVG', 'SHA', 'WNZ', 'CKG', 'KWE', 'CTU', 'URC', 'HRB', 'DLC', 'SHE']

records = []
f = open('db/src/data/loads/sales.csv', 'w')
f.write(header)

for x in range(1,10000):
    id = ('0' * (4-len(str(x)))) + str(x)   # (str(x) + ('0' * (4-len(str(x)))))[::-1]
    agency = agencies_list[random.randint(0, 49)]
    date = '2018-08-' + str(random.randint(1, 28))
    a_from = airports_list[random.randint(0, 569)]
    a_to = airports_list[random.randint(0,569)] if airports_list[random.randint(0,569)] != a_from else airports_list[random.randint(0,569)]
    price = random.randint(50000, 400000)/100.0
    f.write('%s,%s,%s,%s,%s,%f\n' % (id, agency, date, a_from, a_to, price))
    records.append('"%s","%s","%s","%s","%s",%f\n' % (id, agency, date, a_from, a_to, price))

print(str(records))



