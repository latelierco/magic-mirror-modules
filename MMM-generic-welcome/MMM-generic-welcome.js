Module.register('MMM-generic-welcome', {
  // Default module config.
  defaults: {
    text: '',
    fontSize: '',
    fontWeight: '',
    intensity: '',
    textAlign: '',
    moduleId: 'GENERIC_WELCOME',
    moduleName: 'MMM-generic-welcome',
    firebaseConfig: {
      apiKey: 'AIzaSyDICIrxQCMOPzfDnRo1XS4ScoKyc5_1n0Y',
      authDomain: 'connected-mirror-91cb7.firebaseapp.com',
      projectId: 'connected-mirror-91cb7',
      storageBucket: 'connected-mirror-91cb7.appspot.com',
      messagingSenderId: '111172689510',
      appId: '1:111172689510:web:aee0b505696a7e89a897a7',
      measurementId: 'G-X34HXJ0LQ2'
    }
  },

  start() {
    this.contents = this.config.contents;
    this.moduleId = this.config.moduleId;
    this.moduleName = this.config.moduleName;
    this.firebaseConfig = this.config.firebaseConfig;
    this.sendSocketNotification(this.config.moduleId + '_CONFIG', { config: this.config });
  },

  getTemplate () {
    return 'MMM-generic-welcome.njk';
  },

  getTemplateData () {
    if (!this.contents || !this.contents.length)
      return {};

    const {
      text = '',
      font_size: fontSize = '',
      font_weight: fontWeight = '',
      intensity = '',
      text_align: textAlign = ''
    } = this.contents[0];

    const styleClasses = `${ fontSize } ${ fontWeight } ${ intensity } ${ textAlign }`;

    return Object.assign({}, { classes: styleClasses }, { text });
  },

  socketNotificationReceived(notification, payload) {

    if(notification !== 'GENERIC_WELCOME_CONTENTS')
      return;

    const { contents } = payload;
    if (this.areContentsValid(contents) === false) {
      return;
    }

    this.contents = contents;
    this.updateDom();
  },


  areContentsValid(contents) {
    return contents.some(
      contentItem => this.isContentValid(contentItem) === false
    ) && true || false;
  },


  isContentValid(contentItem) {
    const {
      text = null,
      fontSize = null,
      fontWeight = null,
      intensity = null,
      textAlign = null
    } = contentItem;

    if (
      !text ||
      !fontSize ||
      !fontWeight ||
      !intensity ||
      !textAlign
    ) return false;
    return true;
  },


  notificationReceived(notification, payload, sender) {
    if (this.isModuleNotif(notification) === false)
      return;
  },

  isModuleNotif(notification) {
    return /^(GENERIC_WELCOME)(.*)?$/.test(notification);
  }
});
