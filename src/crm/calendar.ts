export interface AvailableSlot {
  slotStart: Date;
  slotEnd: Date;
  formattedTime: string;
}

export function getAvailableMeetingSlots(baseDate: Date = new Date()): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const start = new Date(baseDate);
  start.setHours(10, 0, 0, 0); // 10:00 AM

  for (let i = 0; i < 4; i++) {
    const slotStart = new Date(start.getTime() + i * 60 * 60 * 1000);
    const slotEnd = new Date(slotStart.getTime() + 45 * 60 * 1000);

    const timeStr = slotStart.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true });
    slots.push({
      slotStart,
      slotEnd,
      formattedTime: timeStr,
    });
  }

  return slots;
}
