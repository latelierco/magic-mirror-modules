# prim.iledefrance-mobilites.fr/apis

## Auth

user : connected.mirror.latelier@gmail.com
passw : Plesase ask @loic

## Calculateur Ile-de-France Mobilités - Messages Info Trafic (v2)

doc. ref. : https://prim.iledefrance-mobilites.fr/apis/idfm-navitia-line_reports-v2

Example query :

```


	curl -i -H 'apiKey: < _api key_ > ' \
	'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/journeys?from=< _longitude_ >;< _latitude_ > &max_duration=< max duration >'


```


```bash


	curl -i -H 'apiKey: RMJ7ZSN0HTnw8N0b3dnwprETkoGEIng5' \
	'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/journeys?from=2.3157235656261714;48.95300712760794&max_duration=2000'


	curl -X 'GET' \
	  'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/journeys?from=2.3425639124365905%3B48.86061050382764&to=2.315689371572526%3B48.95302396272498&datetime=20240802T1100&datetime_represents=departure&max_nb_transfers=2&max_duration_to_pt=600&data_freshness=realtime&max_duration=4500' \
	  -H 'apiKey: RMJ7ZSN0HTnw8N0b3dnwprETkoGEIng5' \
	  -H 'accept: application/json'

	curl -X 'GET' \
	  'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/disruptions' \
	  -H 'apiKey: RMJ7ZSN0HTnw8N0b3dnwprETkoGEIng5' \
	  -H 'accept: application/json'

	curl -X GET \
		'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/disruptions/0001be24-508a-11ef-a8d9-0a58a9feac02' \
		-H 'apiKey: RMJ7ZSN0HTnw8N0b3dnwprETkoGEIng5' \
		-H 'accept: application/json'


```


9 rue Guynemer 93800 Epinay sur Seine
Rose Bertin
48.95302396272498, 2.315689371572526
2.315689371572526;48.95302396272498


L'Atelier
46 rue de l'arbre sec 75001 Paris
48.86061050382764, 2.3425639124365905
2.3425639124365905;48.86061050382764

Datetime format is `YYYYMMDDTHHMM`

	Example: 20240802T1630 for 2024-08-02 @ 16:30



1722607465857

places-api-resp


---

Ok, voici un petit CR des propos échangé aujourd'hui en point hebdo Miroir Connecté:

A ce stade : 2 modules à titre d'exemple d'intégration
	- intégration news en français - le monde (contenu générique)
	- intégration IDF Mobilité, trajet utilisateur (contenu personnalisé)



	event reco user

		------------------------ nom de user ---------------> firebase


		<----------------------- profile user --------------- firebase 

			profile:
				name_first
				name_last
				location_work <-- extract for next query
					address
					zip_code (code postal)
					city
				location_home <-- extract for next query
					address
					zip_code (code postal)
					city
				optins
					public_transport_info: bool === false







	    location_work - concatenation into string -> departure (location)
	    location_home -- concatenation into string --> arrival (location)


		----------------- departure / arrival --------> API IDF Mobilités

		<--------------- departure and arrival -------- API IDF Mobilités
			         long. and lat. geo coordinates





		

						      departure
						   	      geoloc long / lat

		-----------------------            -----------> API IDF Mobilités

							  arrival
								  geoloc long / lat


        <-------------- journey calculation ----------- API IDF Mobilités









        -------------------- disruption ID -----------> API IDF Mobilités

        <----------------- disruption object ---------- API IDF Mobilités



TODO:
	- assouplir l'affichage
	- possiblement ajouter des pictos
	- documentation
	- code cleanup => Ok