const NodeHelper = require('node_helper');
const Log = require('logger');

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
    this.contents = [];
    this.moduleName = '';
    this.firebaseConfig = null;
  },


  async socketNotificationReceived (notification, payload) {

    if (this.isModuleNotif(notification) === false)
      return;

    if (notification !== 'GENERIC_WELCOME_CONFIG')
      return;

    this.setUp(payload);
    this.contents = await this.getModuleContents();
    return this.sendSocketNotification('GENERIC_WELCOME_CONTENTS', {
      contents: this.contents
    });
  },


  setUp(payload) {

    const {
      moduleName = null,
      firebaseConfig = null
    } = payload?.config;

    this.moduleName = moduleName;
    this.firebaseConfig = firebaseConfig;

    console.info('[GENERIC_WELCOME][INFO] config setup - OK');
    this.initDb()
  },


  isModuleNotif(notification) {
    return /^(GENERIC_WELCOME_)(.*)?$/.test(notification);
  },


  initDb() {
    const firebaseConfig = this.firebaseConfig;
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    console.info('[GENERIC_WELCOME][INFO] db setup - OK');
  },


  async getModuleContents(moduleName) {

    try {
      const contents = [];

      const q = query(
        collection(this.db, 'contents'),
        where('module_name', '==', this.moduleName),
        where('active', '==', true)
      );

      const snap = await getDocs(q)
      snap.forEach(doc => {
        const data = doc.data();
        contents.push(Object.assign({}, { id: doc.id }, data));
      });

      console.info(`[GENERIC_WELCOME][INFO] Got contents for module ${ this.moduleName } - OK`);
      return contents;

    } catch(err) {
      console.error(err);
    }
  }
});
