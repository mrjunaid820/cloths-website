const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAdmin } = require('../auth');

// POST /api/messages - Public contact form submission
router.post('/', (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const result = db.prepare(`
      INSERT INTO messages (name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, phone || '', subject || 'General Inquiry', message);

    console.log(`[CONTACT INQUIRY RECEIVED] From ${name} (${email}): ${subject}`);

    res.status(201).json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Thank you for contacting Aura Atelier. Our concierge team will reach out shortly.'
    });
  } catch (err) {
    console.error('Error saving message:', err);
    res.status(500).json({ error: 'Failed to submit contact inquiry' });
  }
});

// GET /api/messages - Admin list
router.get('/', verifyAdmin, (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// PATCH /api/messages/:id/read - Mark as read
router.patch('/:id/read', verifyAdmin, (req, res) => {
  try {
    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking message read:', err);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// DELETE /api/messages/:id - Delete message
router.delete('/:id', verifyAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Message removed' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
