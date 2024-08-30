// MMM-news-le-monde
// node_helper

const { XMLParser, XMLValidator } = require('fast-xml-parser');
const NodeHelper = require('node_helper');
const Log = require('logger');


module.exports = NodeHelper.create({


	// Override start method.
	start() {
		this.xmlParser = new XMLParser();
		this.url = null;
		this.config = null;
	},


	async socketNotificationReceived(notification, payload) {

		try {
			if (this.isNewsNotif(notification) === false)
				return;

			if (notification !== 'NEWS_LE_MONDE_CONFIG')
				return;

			await this.cycle(payload);
			await this.hourlyCycle(payload)

		} catch(err) {
			console.error(err);
		}

	},


	isNewsNotif(notification) {
		return /^NEWS_LE_MONDE(.*)?$/.test(notification);
	},


	hourlyCycle(payload) {
		setInterval(async() => {
			await this.cycle(payload);
		}, 60 * 60 * 1000)
	},


	async cycle(payload) {
		this.config = payload?.config;
		console.info('[NEWS_LE_MONDE][INFO] config setup - OK');
		const news = await this.getNews();
		console.info('[NEWS_LE_MONDE] got news from RSS server - OK');
		await this.sendToFront(news);
		console.info('[NEWS_LE_MONDE] sent news to front - OK');
	},


	async getNews() {
		const respText = await this.newsFetch();
		return await this.getItems(respText);
	},


	async sendToFront(news) {
		return this.sendSocketNotification('NEWS_LE_MONDE_CONTENT', news);
	},


	async newsFetch() {
		try {
			const { url } = this.config;
			if (!url || !url?.length)
				return;	

			const resp = await fetch(url);
			if (!resp.ok)
				throw Error(`Error: response status code ${ resp.status }`);

			return await resp.text()

		} catch(err) {
			console.error('[NEWS_LE_MONDE][ERROR]: Error: data fetch error');
			console.error(err);
			return false;
		}
	},


	getItems(respText) {
		const parsed = this.parse(respText);
		const list = this.getList(parsed)

		if (!list.length)
			return [];

		return list.reduce((prev, curr) => prev.push({
			title: curr.title,
			description: curr.description
		}) && prev, []);
	},


	parse(respText) {
		if (this.xmlValidate(respText) === false)
			return [];
		return this.xmlParser.parse(respText);
	},


	getList(parsed) {
		return parsed?.rss?.channel?.item?.length &&
			parsed.rss.channel.item || [];
	},


	xmlValidate(respText) {
		try {
			XMLValidator.validate(respText)
			return true;
		} catch(err) {
			console.error('[NEWS_LE_MONDE][ERROR]: Error: XML validation error');
			console.error(err);
			return false;
		}
	},
});
