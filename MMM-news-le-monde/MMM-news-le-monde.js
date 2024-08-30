Module.register('MMM-news-le-monde', {

	// Default module config.

	defaults: {
		MAX_NEWS_LENGTH: 20,
		url: 'https://www.lemonde.fr/rss/en_continu.xml?refresh=' + Math.floor(Math.random() * 1000000),
		news: []
	},


	start() {
		console.debug('this.newsItem', this.newsItem)

		this.url = this.config.url;
		this.news = this.config.news;

		this.sendSocketNotification('NEWS_LE_MONDE_CONFIG', { config: this.config });
	},


	getTemplate () {
		return 'MMM-news-le-monde.njk';
	},


	getTemplateData () {
		return { news: this.news  };
	},


	notificationReceived(notification, payload, sender) {

		if (/^NEWS_LE_MONDE(.*)?$/.test(notification) === false)
			return;
	},


	socketNotificationReceived(notification, payload) {

		if (/^NEWS_LE_MONDE(.*)?$/.test(notification) === false)
			return;

		if (notification === 'NEWS_LE_MONDE_CONTENT') {
			this.news = this.arrayPad(payload);
			console.debug('this.news.length', this.news.length)
			this.updateDom();
		}
	},


	arrayPad(payload) {
		const maxLength = this.config.MAX_NEWS_LENGTH;

		// return the first 60 items
		if (payload.length >= maxLength)
			return payload.slice(0, maxLength);

		// concat until we have 60 items
		let padded = [];
		while(padded.length < maxLength) {
			const projectedArrayLength = padded.length + payload.length;

			if (projectedArrayLength > maxLength) {
				padded = padded.concat(payload.slice(0, (maxLength - padded.length)));
			}
			padded = padded.concat(payload);
		}
		return padded;
	},
});
