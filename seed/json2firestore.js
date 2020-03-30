const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./service_account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const schema = require('./schema').schema;

const json2firestore = (_JSON, db, schema) => {
  return Promise.all(
    Object.keys(schema).map(collection => {
      let promises = [];
      console.log(_JSON[collection]);
      Object.keys(_JSON[collection]).map(_doc => {
        const doc_id = _doc;
        if (_doc === '__type__') return;
        let doc_data = Object.assign({}, _JSON[collection][_doc]);
        Object.keys(doc_data).map(_doc_data => {
          if (doc_data[_doc_data] && doc_data[_doc_data].__type__) delete doc_data[_doc_data];
        });
        promises.push(
          db
            .collection(collection)
            .doc(doc_id)
            .set(doc_data)
            .then(() => {
              return json2firestore(
                _JSON[collection][_doc],
                db.collection(collection).doc(doc_id),
                schema[collection]
              );
            })
        );
      });
      return Promise.all(promises);
    })
  );
};

json2firestore(
  JSON.parse(fs.readFileSync('./firestore.json', 'utf8')),
  admin.firestore(),
  { ...schema }
).then(() => console.log('done')).catch(e => console.log(e));
