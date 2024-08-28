
async function journeyFormat(data) {
	try {
		const journeyData = getJourneyData(data);
		console.info('[INFO] Got journey data = OK');
		const bestJourney = getBestJourney(journeyData);
		const details = getJourneyDetails(bestJourney);
		const sections = await formatSections(bestJourney);
		console.info('[INFO] Formatted journey data = OK');
		return Object.assign({}, details, { sections });
	} catch(err) {
		console.error(err);
	}
}


function getJourneyData(data) {
	const { journeys: journeyData = null } = data;
	if (!journeyData)
		throw Error('Error: no journeys found in response data');
	return journeyData;
}


function getBestJourney(journeyData) {
	const bestJourney = journeyData.filter(item => item?.type === 'best')?.[0];
	if (!bestJourney)
		throw Error('Error: no best journey found in response data');
	return bestJourney;
}


function getJourneyDetails(journey) {
	const { duration: durationInSeconds = null, nb_transfers: nbTransfers = null } = journey;
	return { duration: translateDuration(durationInSeconds), nbTransfers };
}


function translateDuration(durationInSeconds) {
	let hours, minutes, str = '';

	hours = durationInSeconds / (60 * 60);

	if (hours < 1) {
		hours = 0;
		str += `${ Math.ceil(durationInSeconds / 60) } minutes`;
	}
	else {
		minutes -= Math.ceil((hours * 60) / 60);
		str += `${ Math.floor(hours) } heure(s) et `;
		str += `${ Math.floor(minutes) } minute(s)`;
	}

	return str;
}


async function formatSections(journey) {

	const formatPromises = journey.sections.map(async(section) => {
		const p = await formatSection(section);
		return p;
	});
	return await Promise.all(formatPromises);
}


async function formatSection(section) {

	const {
		to: {
			name: dest = null
		} = {},
		from: {
			name: from = null
		} = {},
		mode = null,
		type = null,
		duration: durationInSeconds = null,
		departure_date_time: departureDateTime = null,
		arrival_date_time: arrivalDateTime = null,
		display_informations: {
			commercial_mode: commercialMode = null,
			physical_mode: physicalMode = null,
			network = null,
			label = null,
			direction =null,
			links = null
		} = {}
	} = section;

	const [ departure, arrival ] = timesFormat([
		departureDateTime, 
		arrivalDateTime
	]);

	const transportationMode = getMode({
		mode,
		type,
		physicalMode,
		network,
		label
	});

	const displayInfo = getDisplayInfo({
		transportationMode,
		commercialMode,
		physicalMode,
		network,
		label,
		direction
	});


	const duration = translateDuration(durationInSeconds);
	const disruptions = await getDisruptions(section)
	return stringFormatSection({from, dest, transportationMode, displayInfo, departure, duration, disruptions});
}


function getMode(options) {

	const {
		mode,
		type,
		physicalMode,
		network,
		label
	} = options;

	return !!mode && mode ||
		!!type && type ||
		!!network && network + ' - ' +
			physicalMode + ' - ' +
			label;
}


function timesFormat(times) {
	return times.map(item => {
		const hours = item.substr(9, 2);
		const minutes = item.substr(11, 2);
		return hours + 'h' + minutes;
	});
}


function getDisplayInfo(options) {

	const {
		transportationMode,
		commercialMode,
		physicalMode,
		network,
		label,
		direction
	} = options;


	if (transportationMode === 'walking' || transportationMode === 'waiting')
		return transportationMode;
	if (commercialMode === null && physicalMode === null)
		return null;

	return`${ network && network + ' ' || '' }${ physicalMode } ${ label } - dir. ${ direction }`;

}


function stringFormatSection(options) {

	let strMessage = null;

	const {
		from,
		dest,
		transportationMode,
		displayInfo,
		departure,
		duration,
		disruptions
	} = options;

	switch(transportationMode) {
			case 'walking':
				strMessage = `${ departure } - de ${ from } à ${ dest } - ${ duration } de marche`;
				break;
			case 'waiting':
				strMessage = `${ duration } d'attente`;
				break;
			default:
				strMessage = `${ departure } - de ${ from } à ${ dest } - ${ displayInfo } - ${ duration }`

	}

	if (disruptions?.length)
		return { message: strMessage, disruptions };
	return { message: strMessage };
}


async function getDisruptions(section) {
	const { display_informations: { links = null } = {} } = section;

	if (links === null)
		return []

	const disruptionsPromises = links.filter(link => link?.type === 'disruption')
		.map(async(link) => {
			const p = await queryDisruption(link.id);
			return p;
		});
	const allDisruptions = await Promise.all(disruptionsPromises);
	return formatDisruptions(allDisruptions);
}


async function queryDisruption(disruptionId) {

	const url = `https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/disruptions/${ disruptionId }`;

	const resp = await fetch(url, {
		headers: {
			accept: 'application/json',
			apiKey: 'RMJ7ZSN0HTnw8N0b3dnwprETkoGEIng5'
		}
	});

	if (!resp.ok)
		throw Error(`Error: call to disruption route failed with status ${resp.status} - id ${ disruptionId }`);

	return await resp.json();
}


function formatDisruptions(allDisruptions) {

	const errorCodes = {
		'SIGNIFICANT_DELAYS': 'Délais significatifs',
		'REDUCED_SERVICE': 'Service réduit',
		'NO_SERVICE': 'Pas de service',
		'MODIFIED_SERVICE': 'Service Modifié',
		'ADDITIONAL_SERVICE': 'Service additionnel',
		'UNKNOWN_EFFECT': 'Problème non identifié sur l\'itinéraire',
		'DETOUR': 'Détour',
		'OTHER_EFFECT': 'Problème sur l\'itinéraire',
	};

	return allDisruptions.filter(
			disruption => !disruption?.tags?.some(tag => /^(.*)ascenseur(.*)$/i.test(tag))
		)
		.map(disruption => {
			const severityIndicator = disruption?.severity?.effect || null;
			const severityMessage = errorCodes[severityIndicator];
			const textMessages = disruption?.messages?.filter(
				message => message?.channel?.content_type === 'text/html'
			)?.[0]?.text;
			return { severityMessage, textMessages }
		})
		.map(obj => {
			const { severityMessage, textMessages } = obj;
			return `${ !!severityMessage && severityMessage + ': ' || ''}${ !!textMessages && strpHTMLToStr(textMessages) || '' }`;
		})
		.filter(message => !!message.length);

}


function strpHTMLToStr(str) {
	return str.replace(/<[^>]*>/g, '')
		.replace('.Plus d\'informations', '. Plus d\'informations');
}


module.exports = journeyFormat;
