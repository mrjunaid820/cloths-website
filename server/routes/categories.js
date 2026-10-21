const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAdmin } = require('../auth');

// GET /api/categories
router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();

    // Dynamically calculate product count for each category
    const categoriesWithCount = categories.map(cat => {
      const countResult = db.prepare(`
        SELECT count(*) as count FROM products 
        WHERE LOWER(category) = LOWER(?) OR LOWER(REPLACE(category, ' ', '-')) = LOWER(?)
      `).get(cat.name, cat.slug);
      return {
        ...cat,
        item_count: countResult ? countResult.count : 0
      };
    });

    res.json(categoriesWithCount);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// POST /api/categories - Admin create
router.post('/', verifyAdmin, (req, res) => {
  try {
    const { name, image, description } = req.body;
    if (!name || !image) {
      return res.status(400).json({ error: 'Category name and image URL are required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const result = db.prepare(`
      INSERT INTO categories (name, slug, image, description)
      VALUES (?, ?, ?, ?)
    `).run(name, slug, image, description || '');

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Admin update
router.put('/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, description } = req.body;

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : existing.slug;

    db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        slug = ?,
        image = COALESCE(?, image),
        description = COALESCE(?, description)
      WHERE id = ?
    `).run(name, slug, image, description, id);

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Admin delete
router.delete('/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
