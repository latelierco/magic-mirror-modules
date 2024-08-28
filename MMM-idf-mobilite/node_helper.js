// MMM-idf-mobilite
// node_helper

const NodeHelper = require('node_helper');
const Log = require('logger');
const journeyFormat = require('./journeyFormat');

const {
  getFirestore,
  collection,
  where,
  query,
  doc,
  getDoc,
  getDocs,
} = require('firebase/firestore');

const { initializeApp } = require('firebase/app');



module.exports = NodeHelper.create({


	start() {
		this.db = null;
		this.profile = {};
	},


	async socketNotificationReceived (notification, payload) {

		if (this.isModuleNotif(notification) === false)
			return;

		switch(notification) {

				case 'PUBLIC_TRANSPORTATION_IDF_MOB_CONFIG':					
					this.config = payload?.config;
					console.info('[PUBLIC_TRANSPORTATION_IDF_MOB][INFO] config setup - OK');
					this.initDb()
					break;

				case 'USERS_LOGIN_USER_IDENTITY':
					const { user: userName } = payload;
					const journey = await this.getPublicTransportationDetails(userName);
					console.info(`[PUBLIC_TRANSPORTATION_IDF_MOB][INFO] Got public transportation info for user ${ userName } - OK`);
					this.sendSocketNotification('PUBLIC_TRANSPORTATION_IDF_MOB_JOURNEY', { profile: this.profile, journey });
					break;

				default:
					return;
		}
	},


	isModuleNotif(notification) {
		return /^(PUBLIC_TRANSPORTATION_IDF_MOB|USERS_LOGIN)(.*)?$/.test(notification);
	},


	initDb() {
		const firebaseConfig = this.config.firebaseConfig;
		const app = initializeApp(firebaseConfig);
		this.db = getFirestore(app);
		console.info('[PUBLIC_TRANSPORTATION_IDF_MOB][INFO] db setup - OK');
	},


	async getPublicTransportationDetails(userName) {

		try {

			const profile = await this.getUserProfile(userName);
			const check = this.isProfileValid(profile);
			if (!check)
				return;

			this.profile = profile;

			const places = await this.getPlaces();
			const journey = await this.getJourney(places);

			return journeyFormat(journey);

		} catch(err) {
			console.error(err);
		}
	},


	async getUserProfile(userName) {

		let profile = null;

		const q = query(
			collection(this.db, 'users'),
			where('user_name', '==', userName)
		);

		const snap = await getDocs(q)
		snap.forEach(doc => {
			profile = doc.data();
			profile.id = doc.id
		})

		console.info(`[PUBLIC_TRANSPORTATION_IDF_MOB][INFO] Got profile for user ${ userName } - OK`);
		return profile;
	},


	isProfileValid(profile) {

		const {
			location_home = null,
			location_work = null,
			optins = null
		} = profile;

		if (
			!location_home ||
			!location_work ||
			optins?.public_transportation_info === false
		) {
			console.warn(`[PUBLIC_TRANSPORTATION_IDF_MOB][WARNING] profile is not complete ${ !!profile.name_first && 'for ' + profile.name_first || ''  }`);
			return false;
		}
		return true;
	},


	async getPlaces() {

		const {
			location_home = null,
			location_work = null
		} = this.profile;

		const homeStr = this.getLocationToString(location_home);
		const workStr = this.getLocationToString(location_work);

		const placesRes = await this.getPlacesQueries({ homeStr, workStr });
		console.info(`[PUBLIC_TRANSPORTATION_IDF_MOB][INFO] Got geoloc data for user - OK`);
		return this.getPlacesIds(placesRes);
	},


	async getJourney(places) {
		const url = this.getJourneyUrl(places);
		const resp = await fetch(url, {
			headers: {
				apiKey: this.config.idfMobilite.apiKey
			}
		});
		if (!resp.ok)
			throw Error(`Error: get journey query status code: ${ resp.status }`);
		return await resp.json();
	},


	getLocationToString(location) {
		const {
			address = null,
			zip_code = null,
			city = null,
		} = location;

		const locationToString = [ address ].concat([zip_code], [city]);
		return locationToString.filter(word => !!word?.length).join(' ');
	},


	async getPlacesQueries(addresses) {

		const entries = Object.entries(addresses)

		const ps = entries.map(
			async(address) => await this.getPlacesCallback(address)
		);

		return Promise.all(ps);
	},


	getPlacesIds(placesRes) {
		return placesRes.reduce((prev, curr) => {
			let key = null;
			if (!!curr?.home === true)
				key = 'home'
			else
				key = 'work'
			prev[key] = curr?.[key]?.places?.[0]?.id;
			return prev;
		}, {});
	},


	async getPlacesCallback(address) {

		const url = this.getPlacesUrl(address[1]);

		const resp = await fetch(url, {
			headers: {
				accept: 'application/json',
				apiKey: this.config.idfMobilite.apiKey,
			}
		});

		if (!resp.ok)
			throw Error(`Error: get places query status code: ${ resp.status }`);

		return this.formatPlacesResults(address, resp);
	},


	getPlacesUrl(address) {
		return `${ this.config.idfMobilite.baseUrl }places?q=${ encodeURI(address) }`;
	},


	async formatPlacesResults(address, resp) {
		const data = await resp.json();
		const result = {};
		const key = address[0].replace('Str', '');
		result[key] = data;
		return result;
	},


	getJourneyUrl(places) {
		const { home, work } = places;
		const datetime = this.getDateTime();
		return `${ this.config.idfMobilite.baseUrl }journeys?from=${ work }&to=${ home }&datetime=${ datetime }&datetime_represents=departure&max_nb_transfers=2&max_duration_to_pt=600&data_freshness=realtime&max_duration=4500`;
	},


	getDateTime() {
		const now = new Date();
		const offset = now.getTimezoneOffset();
		const localTime = now.getTime() - (offset * 60 * 1000);
		return new Date(localTime).toISOString()
			.split(':')
			.filter((parts, idx) => idx < 2)
			.join('')
			.replace(/-/g, '');
	},

});
