export const SocketEvents = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  NEW_MESSAGE: 'NEW_MESSAGE',  // 修改为大写以匹配前端
  MESSAGE: 'message',
  ERROR: 'error'
} as const;
