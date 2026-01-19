// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: "*",
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Connexion à la base de données existante payment.db
const dbPath = path.join(__dirname, 'payment.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur connexion à payment.db:', err.message);
    process.exit(1);
  } else {
    console.log('✓ Connecté à payment.db');
    verifyTables();
  }
});

// Vérifier que les tables existent
function verifyTables() {
  db.all(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name IN ('T_SERVICE', 'T_PROVIDER', 'T_DENOMINATION')
  `, (err, tables) => {
    if (err) {
      console.error('❌ Erreur vérification tables:', err.message);
      return;
    }

    console.log('✓ Tables trouvées:');
    tables.forEach(t => console.log(`  - ${t.name}`));

    // Afficher la structure des tables
    showTableStructure();
  });
}

function showTableStructure() {
  const tableNames = ['T_SERVICE', 'T_PROVIDER', 'T_DENOMINATION'];

  tableNames.forEach(tableName => {
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) return;
      console.log(`\n📋 Structure ${tableName}:`);
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
    });
  });
}

// ===== ROUTE DE TEST =====
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API connectée à payment.db',
    database: 'payment.db'
  });
});

// ===== ROUTE: Tous les SERVICES =====
app.get('/api/services', (req, res) => {
  const query = `
    SELECT * FROM T_SERVICE
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Erreur requête:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
});

// ===== ROUTE: Un SERVICE spécifique =====
app.get('/api/services/:serviceCode', (req, res) => {
  const { serviceCode } = req.params;

  const query = `
    SELECT * FROM T_SERVICE WHERE SERVICE_CODE = ?
  `;

  db.get(query, [serviceCode], (err, row) => {
    if (err) {
      console.error('Erreur requête:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }

    res.json({
      success: true,
      data: row
    });
  });
});

// ===== ROUTE: Tous les PROVIDERS =====
app.get('/api/providers', (req, res) => {
  const query = `
    SELECT * FROM T_PROVIDER
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Erreur requête:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
});

// ===== ROUTE: Providers d'un SERVICE =====
app.get('/api/services/:serviceCode/providers', (req, res) => {
  const { serviceCode } = req.params;

  const query = `
    SELECT * FROM T_PROVIDER WHERE SERVICE_ID = ?
  `;

  db.all(query, [serviceCode], (err, rows) => {
    if (err) {
      console.error('Erreur requête:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
});

// ===== ROUTE: Toutes les DENOMINATIONS =====
app.get('/api/denominations', (req, res) => {
  const query = `
    SELECT * FROM T_DENOMINATION
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Erreur requête:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
});

// ===== ROUTE: Denominations d'un PROVIDER =====
app.get('/api/providers/:providerId/denominations', (req, res) => {
  const { providerId } = req.params;

  const query = `
    SELECT * FROM T_DENOMINATION WHERE PROVIDER_ID = ?
  `;

  db.all(query, [providerId], (err, rows) => {
    if (err) {
      console.error('Erreur requête:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
});

// ===== ROUTE: Structure IMBRIQUÉE - Tous services avec providers et denominations =====
app.get('/api/services-full', (req, res) => {
  const query = `
    SELECT json_group_array(
        json_object(
            'serviceCode', s.SERVICE_CODE,
            'serviceName', s.SERVICE_NAME,
            'providers', (
                SELECT json_group_array(
                    json_object(
                        'providerCode', p.PROVIDER_CODE,
                        'providerNameAr', p.PROVIDER_NAME_AR,
                        'providerNameEn', p.PROVIDER_NAME_EN,
                        'denominations', (
                            SELECT json_group_array(
                                json_object(
                                    'amount', d.AMOUNT,
                                    'denomCode', d.DENOM_CODE,
                                    'labelAr', d.LBL_AR,
                                    'labelEn', d.LBL_EN,
                                    'msgAr', d.MSG_AR,
                                    'msgEn', d.MSG_EN
                                )
                            )
                            FROM T_DENOMINATION d
                            WHERE d.PROVIDER_ID = p.PROVIDER_CODE
                        )
                    )
                )
                FROM T_PROVIDER p
                WHERE p.SERVICE_ID = s.SERVICE_CODE
            )
        )
    ) AS services_json
    FROM T_SERVICE s
  `;

  db.get(query, (err, row) => {
    if (err) {
      console.error('Erreur requête:', err.message);
      return res.status(500).json({ error: err.message });
    }

    try {
      const services = row.services_json ? JSON.parse(row.services_json) : [];
      res.json({
        success: true,
        count: services.length,
        data: services
      });
    } catch (parseErr) {
      console.error('Erreur parsing JSON:', parseErr.message);
      res.status(500).json({ error: 'Erreur traitement données' });
    }
  });
});

// ===== ROUTE: Un SERVICE avec structure imbriquée =====
app.get('/api/services/:serviceCode/full', (req, res) => {
  const { serviceCode } = req.params;

  const query = `
    SELECT json_object(
        'serviceCode', s.SERVICE_CODE,
        'serviceName', s.SERVICE_NAME,
        'providers', (
            SELECT json_group_array(
                json_object(
                    'providerCode', p.PROVIDER_CODE,
                    'providerNameAr', p.PROVIDER_NAME_AR,
                    'providerNameEn', p.PROVIDER_NAME_EN,
                    'denominations', (
                        SELECT json_group_array(
                            json_object(
                                'amount', d.AMOUNT,
                                'denomCode', d.DENOM_CODE,
                                'labelAr', d.LBL_AR,
                                'labelEn', d.LBL_EN,
                                'msgAr', d.MSG_AR,
                                'msgEn', d.MSG_EN
                            )
                        )
                        FROM T_DENOMINATION d
                        WHERE d.PROVIDER_ID = p.PROVIDER_CODE
                    )
                )
            )
            FROM T_PROVIDER p
            WHERE p.SERVICE_ID = s.SERVICE_CODE
        )
    ) AS service_json
    FROM T_SERVICE s
    WHERE s.SERVICE_CODE = ?
  `;

  db.get(query, [serviceCode], (err, row) => {
    if (err) {
      console.error('Erreur requête:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }

    try {
      const service = JSON.parse(row.service_json);
      res.json({
        success: true,
        data: service
      });
    } catch (parseErr) {
      console.error('Erreur parsing JSON:', parseErr.message);
      res.status(500).json({ error: 'Erreur traitement données' });
    }
  });
});

// ===== ROUTE: Un PROVIDER avec ses denominations =====
app.get('/api/providers/:providerCode/full', (req, res) => {
  const { providerCode } = req.params;

  const query = `
    SELECT json_object(
        'providerCode', p.PROVIDER_CODE,
        'providerNameAr', p.PROVIDER_NAME_AR,
        'providerNameEn', p.PROVIDER_NAME_EN,
        'serviceId', p.SERVICE_ID,
        'denominations', (
            SELECT json_group_array(
                json_object(
                    'amount', d.AMOUNT,
                    'denomCode', d.DENOM_CODE,
                    'labelAr', d.LBL_AR,
                    'labelEn', d.LBL_EN,
                    'msgAr', d.MSG_AR,
                    'msgEn', d.MSG_EN
                )
            )
            FROM T_DENOMINATION d
            WHERE d.PROVIDER_ID = p.PROVIDER_CODE
        )
    ) AS provider_json
    FROM T_PROVIDER p
    WHERE p.PROVIDER_CODE = ?
  `;

  db.get(query, [providerCode], (err, row) => {
    if (err) {
      console.error('Erreur requête:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Provider non trouvé' });
    }

    try {
      const provider = JSON.parse(row.provider_json);
      res.json({
        success: true,
        data: provider
      });
    } catch (parseErr) {
      console.error('Erreur parsing JSON:', parseErr.message);
      res.status(500).json({ error: 'Erreur traitement données' });
    }
  });
});

// ===== GESTION DES ERREURS =====
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ===== DÉMARRAGE DU SERVEUR =====
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}\n`);
  console.log('📍 Endpoints disponibles:');
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   GET  http://localhost:${PORT}/api/services`);
  console.log(`   GET  http://localhost:${PORT}/api/services/:code`);
  console.log(`   GET  http://localhost:${PORT}/api/services/:code/providers`);
  console.log(`   GET  http://localhost:${PORT}/api/services/:code/full`);
  console.log(`   GET  http://localhost:${PORT}/api/providers`);
  console.log(`   GET  http://localhost:${PORT}/api/providers/:code/full`);
  console.log(`   GET  http://localhost:${PORT}/api/services-full\n`);
});

// Fermer la BD à l'arrêt
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('Erreur fermeture:', err.message);
    console.log('\n✓ Connexion fermée');
    process.exit(0);
  });
});