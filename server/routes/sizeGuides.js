const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAdmin } = require('../auth');

// GET /api/size-guides - Public list of all size guides
router.get('/', (req, res) => {
  try {
    const guides = db.prepare('SELECT * FROM size_guides ORDER BY category ASC').all();
    const parsed = guides.map(g => ({
      ...g,
      measurements: typeof g.measurements_json === 'string' ? JSON.parse(g.measurements_json) : (g.measurements_json || [])
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch size guides' });
  }
});

// GET /api/size-guides/:category - Specific category guide
router.get('/:category', (req, res) => {
  try {
    const { category } = req.params;
    const guide = db.prepare('SELECT * FROM size_guides WHERE LOWER(category) = LOWER(?)').get(category);
    if (!guide) {
      // Return fallback standard guide if category not individually matched
      return res.json({
        category: category,
        gender: 'Unisex',
        description: 'Standard atelier sizing reference chart.',
        measurements: [
          { size: 'S', chest: '36-38', waist: '30-32', hips: '36-38' },
          { size: 'M', chest: '38-40', waist: '32-34', hips: '38-40' },
          { size: 'L', chest: '40-42', waist: '34-36', hips: '40-42' },
          { size: 'XL', chest: '42-44', waist: '36-38', hips: '42-44' },
          { size: 'XXL', chest: '44-46', waist: '38-40', hips: '44-46' }
        ],
        fit_tips: 'For custom made-to-measure sizing, please consult our bespoke concierge.'
      });
    }

    res.json({
      ...guide,
      measurements: typeof guide.measurements_json === 'string' ? JSON.parse(guide.measurements_json) : (guide.measurements_json || [])
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/size-guides - Admin create/update size guide
router.post('/', verifyAdmin, (req, res) => {
  try {
    const { category, gender, description, measurements, fit_tips } = req.body;
    if (!category || !measurements) {
      return res.status(400).json({ error: 'Category and measurements are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO size_guides (category, gender, description, measurements_json, fit_tips)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(category) DO UPDATE SET
        gender = excluded.gender,
        description = excluded.description,
        measurements_json = excluded.measurements_json,
        fit_tips = excluded.fit_tips
    `);

    stmt.run(
      category,
      gender || 'Unisex',
      description || '',
      JSON.stringify(measurements),
      fit_tips || ''
    );

    const saved = db.prepare('SELECT * FROM size_guides WHERE category = ?').get(category);
    res.json({
      ...saved,
      measurements: JSON.parse(saved.measurements_json)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
