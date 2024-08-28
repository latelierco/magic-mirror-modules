Module.register('MMM-news-le-monde', {

	// Default module config.

	defaults: {
		fetchInterval: 15 * 60 * 1000,
		url: 'https://www.lemonde.fr/rss/en_continu.xml?refresh=' + Math.floor(Math.random() * 1000000),
		title: '',
		description: '',
		started: false,
	},


	start() {
		this.sendSocketNotification('NEWS_LE_MONDE_CONFIG', { config: this.config })
	},


	getDom() {

		const wrapper = document.createElement('DIV');
		wrapper.setAttribute('id', 'french-news');

		if (
			!this.title ||
			!this.description
		) return wrapper;

		const logo = document.createElement('DIV');
		logo.setAttribute('id', 'french-news-logo');

		const content = document.createElement('DIV');
		content.setAttribute('id', 'french-news-content');

		const titleSpan = document.createElement('SPAN');
		const descriptionSpan = document.createElement('SPAN');

		titleSpan.classList.add('bright');
		titleSpan.classList.add('medium');
		titleSpan.classList.add('semi-thin');
		titleSpan.setAttribute('id', 'french-news-title');

		descriptionSpan.classList.add('dimmed')
		descriptionSpan.classList.add('medium');
		descriptionSpan.classList.add('light');
		descriptionSpan.setAttribute('id', 'french-news-description');

		titleSpan.textContent = this.title + ' : ';
		descriptionSpan.textContent = this.description;

		content.appendChild(titleSpan);
		content.appendChild(descriptionSpan);

		wrapper.appendChild(logo)
		wrapper.appendChild(content)
		return wrapper;
	},




	getTemplate () {
		return 'MMM-news-le-monde.njk';
	},


	getTemplateData () {
		return this.config;
	},


	notificationReceived(notification, payload, sender) {

		if (/^NEWS_LE_MONDE(.*)?$/.test(notification) === false)
			return;

	},


	getParsedNews(payload) {
		try {
			return JSON.parse(payload);
		} catch(err) {
			console.error('[NEWS_LE_MONDE][ERROR] JSON parse error with news batch');
		}
	},


	socketNotificationReceived(notification, payload) {

		if (/^NEWS_LE_MONDE(.*)?$/.test(notification) === false)
			return;

		this.getContent(notification, payload)
	},


	getContent(notification, payload) {

		if (notification !== 'NEWS_LE_MONDE_CONTENT')
			return;

		const {
			title = null,
			description = null
		} = this.getParsedNews(payload);


		if (!title || !description)
			return;

		this.title = title;
		this.description = description;

		this.updateDom( {
			options: {
				speed: 1500,
				animate: {
					in: "animateIn",
					out: "animateOut",
				}
			}
		});
	},
});
