const {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../models/notificationModel')

async function fetchMyNotifications(req, res) {
  try {
    const notifications = await getUserNotifications(req.user.id)
    res.json(notifications)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
}

async function markOneRead(req, res) {
  try {
    const updated = await markNotificationRead(req.params.id, req.user.id)

    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update notification' })
  }
}

async function markAllRead(req, res) {
  try {
    await markAllNotificationsRead(req.user.id)
    res.json({ message: 'Notifications marked as read' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update notifications' })
  }
}

module.exports = {
  fetchMyNotifications,
  markOneRead,
  markAllRead
}
