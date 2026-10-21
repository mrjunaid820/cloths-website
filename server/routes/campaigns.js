const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAdmin } = require('../auth');

// GET /api/campaigns - Public active campaigns
router.get('/', (req, res) => {
  try {
    const campaigns = db.prepare(`
      SELECT * FROM seasonal_campaigns 
      WHERE is_active = 1 
      ORDER BY id DESC
    `).all();
    res.json(campaigns.map(c => ({ ...c, is_active: Boolean(c.is_active) })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/campaigns/all - Admin list
router.get('/all', verifyAdmin, (req, res) => {
  try {
    const campaigns = db.prepare('SELECT * FROM seasonal_campaigns ORDER BY id DESC').all();
    res.json(campaigns.map(c => ({ ...c, is_active: Boolean(c.is_active) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/campaigns - Admin create campaign
router.post('/', verifyAdmin, (req, res) => {
  try {
    const {
      title,
      subtitle,
      badge,
      banner_image,
      cta_text,
      cta_link,
      accent_color,
      particle_effect,
      is_active,
      start_date,
      end_date
    } = req.body;

    if (!title || !banner_image) {
      return res.status(400).json({ error: 'Title and banner image URL are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO seasonal_campaigns (
        title, subtitle, badge, banner_image, cta_text, cta_link,
        accent_color, particle_effect, is_active, start_date, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const r = stmt.run(
      title,
      subtitle || '',
      badge || 'Limited Edition Capsule',
      banner_image,
      cta_text || 'Explore Collection',
      cta_link || 'shop',
      accent_color || '#d4af37',
      particle_effect || 'gold_shimmer',
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      start_date || null,
      end_date || null
    );

    const created = db.prepare('SELECT * FROM seasonal_campaigns WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json({ ...created, is_active: Boolean(created.is_active) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/campaigns/:id - Admin update
router.put('/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      badge,
      banner_image,
      cta_text,
      cta_link,
      accent_color,
      particle_effect,
      is_active,
      start_date,
      end_date
    } = req.body;

    const stmt = db.prepare(`
      UPDATE seasonal_campaigns SET
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        badge = COALESCE(?, badge),
        banner_image = COALESCE(?, banner_image),
        cta_text = COALESCE(?, cta_text),
        cta_link = COALESCE(?, cta_link),
        accent_color = COALESCE(?, accent_color),
        particle_effect = COALESCE(?, particle_effect),
        is_active = COALESCE(?, is_active),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date)
      WHERE id = ?
    `);

    stmt.run(
      title || null,
      subtitle !== undefined ? subtitle : null,
      badge || null,
      banner_image || null,
      cta_text || null,
      cta_link || null,
      accent_color || null,
      particle_effect || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      start_date || null,
      end_date || null,
      id
    );

    const updated = db.prepare('SELECT * FROM seasonal_campaigns WHERE id = ?').get(id);
    res.json({ ...updated, is_active: Boolean(updated.is_active) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/campaigns/:id - Admin delete
router.delete('/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM seasonal_campaigns WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
