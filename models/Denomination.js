class Denomination {
  constructor(denomCode, providerId, amount, labelAr, labelEn, msgAr, msgEn) {
    this.denomCode = denomCode;
    this.providerId = providerId;
    this.amount = amount;
    this.labelAr = labelAr;
    this.labelEn = labelEn;
    this.msgAr = msgAr;
    this.msgEn = msgEn;
  }

  static createTable(db) {
    return new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS T_DENOMINATION (
          DENOM_CODE TEXT PRIMARY KEY,
          PROVIDER_ID TEXT NOT NULL,
          AMOUNT DECIMAL(10, 2) NOT NULL,
          LBL_AR TEXT NOT NULL,
          LBL_EN TEXT NOT NULL,
          MSG_AR TEXT,
          MSG_EN TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (PROVIDER_ID) REFERENCES T_PROVIDER(PROVIDER_CODE)
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
        SELECT * FROM T_DENOMINATION
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getById(db, denomCode) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM T_DENOMINATION WHERE DENOM_CODE = ?
      `, [denomCode], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static getByProviderId(db, providerId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM T_DENOMINATION WHERE PROVIDER_ID = ?
      `, [providerId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static insert(db, denomCode, providerId, amount, labelAr, labelEn, msgAr, msgEn) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO T_DENOMINATION 
        (DENOM_CODE, PROVIDER_ID, AMOUNT, LBL_AR, LBL_EN, MSG_AR, MSG_EN) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [denomCode, providerId, amount, labelAr, labelEn, msgAr, msgEn], function(err) {
        if (err) reject(err);
        else resolve({ 
          denomCode, providerId, amount, labelAr, labelEn, msgAr, msgEn 
        });
      });
    });
  }

  static delete(db, denomCode) {
    return new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM T_DENOMINATION WHERE DENOM_CODE = ?
      `, [denomCode], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
}

module.exports = Denomination;