export type Notification = {
  type: 'info' | 'warning' | 'error'
  message: string
}

let notifications: Notification[] = []

export function add(notification: Notification) {
  notifications.push(notification)
}
export function get() {
  return notifications
}
export function clear() {
  notifications = []
}
