// models/Provider.js
class Provider {
  constructor(providerCode, serviceId, providerNameAr, providerNameEn) {
    this.providerCode = providerCode;
    this.serviceId = serviceId;
    this.providerNameAr = providerNameAr;
    this.providerNameEn = providerNameEn;
  }

  static createTable(db) {
    return new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS T_PROVIDER (
          PROVIDER_CODE TEXT PRIMARY KEY,
          SERVICE_ID TEXT NOT NULL,
          PROVIDER_NAME_AR TEXT NOT NULL,
          PROVIDER_NAME_EN TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (SERVICE_ID) REFERENCES T_SERVICE(SERVICE_CODE)
            ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static getAll(db) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM T_PROVIDER
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(db, providerCode) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM T_PROVIDER WHERE PROVIDER_CODE = ?
      `, [providerCode], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static getByServiceId(db, serviceId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM T_PROVIDER WHERE SERVICE_ID = ?
      `, [serviceId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static insert(db, providerCode, serviceId, providerNameAr, providerNameEn) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO T_PROVIDER 
        (PROVIDER_CODE, SERVICE_ID, PROVIDER_NAME_AR, PROVIDER_NAME_EN) 
        VALUES (?, ?, ?, ?)
      `, [providerCode, serviceId, providerNameAr, providerNameEn], function(err) {
        if (err) reject(err);
        else resolve({ providerCode, serviceId, providerNameAr, providerNameEn });
      });
    });
  }

  static delete(db, providerCode) {
    return new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM T_PROVIDER WHERE PROVIDER_CODE = ?
      `, [providerCode], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = Provider;
