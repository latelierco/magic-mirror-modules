Module.register("MMM-hello-user", {
	// Default module config.
	defaults: {
		text: "Hello World!"
	},

	getTemplate () {
		return "MMM-hello-user.njk";
	},

	getTemplateData () {
		return this.config;
	},

	capitalize(str) {
		return str.split(' ')
			.map(word => word.trim())
			.filter(word => word.length !== 0)
			.map(word => {
				return word.split('')
					.map((char, idx) => idx === 0 && char.toUpperCase() || char.toLowerCase())
					.join('') + ' '
			})
			.join('')
	},

	getDom() {
		let helloDiv = null;
		const content = this.getContent();
		if (!content)
			return this.hideBlock();
		return this.showBlock(content);
	},

	getContent() {
		if (
			!this.user ||
			this.user === 'NOONE'
		) return null;

		if (
			typeof this.user === 'string' &&
			this.user.toUpperCase() === 'UNKNOWN'
		) return `Bienvenue à l'Atelier !!!`;

		return `Bonjour ${ this.capitalize(this.user) } !!!`;
	},

	hideBlock() {
		return this.getNode();
	},

	showBlock(content) {
		const helloDiv = this.getNode();
		helloDiv.textContent = content;
		return helloDiv;
	},

	getNode() {
		let helloDiv = document.querySelector('#user-greetings-latelier');
		if (!helloDiv) {
			helloDiv = document.createElement('DIV');
			helloDiv.setAttribute('id', 'user-greetings-latelier');
	        helloDiv.classList.add('bright')
	        helloDiv.classList.add('large');
	        helloDiv.textContent = '';
		}
		return helloDiv;
	},

	notificationReceived(notification, payload, sender) {

		if (notification !== 'USERS_LOGIN')
			return;

		this.user = this.parseUser(payload);

		this.updateDom( {
			options: {
				speed: 1500, // animation duration
				animate: {
					in: "backInDown", // animation when module shown (after update)
					out: "backOutUp" // animatation when module will hide (before update)
					// in: "animateIn",
					// out: "animateOut",
				}
			}
		});
	},

	parseUser(payload) {
		if (!!payload?.[0] === false)
			return 'NOONE';
		else
			return payload[0]
	},
});