export interface PushToken {
  token: string;
  type: 'expo' | 'fcm';
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  trigger: { hour: number; minute: number; repeats: boolean };
}
