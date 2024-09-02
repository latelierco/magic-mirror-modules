
Module.register('MMM-idf-mobilite', {


	defaults: {
		moduleId: 'PUBLIC_TRANSPORTATION_IDF_MOB',
		userModule: 'USERS_LOGIN',
		idfMobilite: {
			baseUrl: 'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/',
			apiKey: 'RMJ7ZSN0HTnw8N0b3dnwprETkoGEIng5',
		},
		firebaseConfig: {
			apiKey: 'AIzaSyDICIrxQCMOPzfDnRo1XS4ScoKyc5_1n0Y',
			authDomain: 'connected-mirror-91cb7.firebaseapp.com',
			projectId: 'connected-mirror-91cb7',
			storageBucket: 'connected-mirror-91cb7.appspot.com',
			messagingSenderId: '111172689510',
			appId: '1:111172689510:web:aee0b505696a7e89a897a7',
			measurementId: 'G-X34HXJ0LQ2'
		},
		journey: {
			departureCity: null,
			arrivalCity: null,
			duration: null,
			nbTransfers: null,
			sections: [],
		}
	},


	start() {
		this.sendSocketNotification(this.config.moduleId + '_CONFIG', { config: this.config });
	},


	getTemplate () {
		return 'MMM-idf-mobilite.njk';
	},


	getTemplateData () {

		if (!this.journey)
			return;

		const {
			departureCity = null,
			arrivalCity = null,
			duration = null,
			nbTransfers = null,
			sections = null,
		} = this.journey;

		return {
			departureCity,
			arrivalCity,
			duration,
			nbTransfers,
			sections
		};
	},


	notificationReceived(notification, payload, sender) {

		const regexp = this.getRegExp();
		if (regexp.test(notification) === false)
			return;

		const user = this.getUser(payload);
		if (!user)
			return;

		this.sendSocketNotification(this.config.userModule + '_USER_IDENTITY', { user });
		console.info('[INFO] MMM-idf-mobilite - received and sent socket notification - OK', notification, payload);
	},


	getUser(payload) {
		return payload?.[0] || null;
	},


	socketNotificationReceived(notification, payload) {

		if (notification !== 'PUBLIC_TRANSPORTATION_IDF_MOB_JOURNEY')
			return;

		console.info('[INFO] MMM-idf-mobilite - received socket notification', notification, payload);

		const {
			profile = null,
			journey = null
		} = payload;

		if (!profile || !journey)
			return;

		this.setResponseData(profile, journey);
	},


	getRegExp() {
		const { userModule } = this.config;
		return new RegExp(`^${ userModule }(.*)?$`);
	},


	setResponseData(profile, journey) {

		const {
			location_work: { city: departureCity = null } = {},
			location_home: { city: arrivalCity = null } = {}
		} = profile;

		const {
			duration,
			nbTransfers,
			sections
		} = journey;

		this.journey = {
			departureCity,
			arrivalCity,
			duration,
			nbTransfers,
			sections
		};

		this.updateDom();
	}
});
