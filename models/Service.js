class Service {
  constructor(serviceCode, serviceName) {
    this.serviceCode = serviceCode;
    this.serviceName = serviceName;
  }

  static createTable(db) {
    return new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS T_SERVICE (
          SERVICE_CODE TEXT PRIMARY KEY,
          SERVICE_NAME TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        SELECT * FROM T_SERVICE
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(db, serviceCode) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM T_SERVICE WHERE SERVICE_CODE = ?
      `, [serviceCode], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static insert(db, serviceCode, serviceName) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO T_SERVICE (SERVICE_CODE, SERVICE_NAME) 
        VALUES (?, ?)
      `, [serviceCode, serviceName], function(err) {
        if (err) reject(err);
        else resolve({ serviceCode, serviceName });
      });
    });
  }

  static delete(db, serviceCode) {
    return new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM T_SERVICE WHERE SERVICE_CODE = ?
      `, [serviceCode], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = Service;