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
		this.cycle = null;
		this.news = [];
		this.iteration = 0;
	},


	socketNotificationReceived (notification, payload) {

		if (this.isNewsNotif(notification) === false)
			return;

		if (notification === 'NEWS_LE_MONDE_CONFIG') {
			this.config = payload?.config;
			console.info('[NEWS_LE_MONDE][INFO] config setup - OK')
			this.getNews();
		}
	},


	isNewsNotif(notification) {
		return /^NEWS_LE_MONDE(.*)?$/.test(notification);
	},


	async getNews() {
		try {
			const respText = await this.newsFetch();
			this.news = this.getItems(respText);
			console.info('[NEWS_LE_MONDE] getNews - OK');
			this.initNews();
			this.cycleContent();
		} catch(err) {
			console.error(err);
		}
	},


	initNews() {
		this.cycle = setInterval(async() => await this.getNews(), this.config.fetchInterval || 30 * 60 * 1000);
	},


	cycleContent() {
		console.debug('[NEWS_LE_MONDE][DEBUG] - cycleContent - start');

		this.newsStart();

		setInterval(() => {
			this.newsStart();
		}, 20 * 1000)
	},


	newsStart() {
		return this.news.length &&
			this.sendNext();
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


	sendNext() {
		const news = this.getNext();
		this.sendSocketNotification('NEWS_LE_MONDE_CONTENT', news);
	},


	getNext() {
		let news = this.news[this.iteration];
		if (!news) {
			this.iteration = 0;
			news = this.news[this.iteration];
		}
		++this.iteration;
		return this.serialize(news);
	},


	serialize(news) {
		return JSON.stringify(news)
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
