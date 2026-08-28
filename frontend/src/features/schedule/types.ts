export interface BusinessHours {
  dayOfWeek: number
  dayName: string
  enabled: boolean
  openTime: string | null
  closeTime: string | null
  breakStart: string | null
  breakEnd: string | null
}

export interface BusinessHoliday {
  id: string
  holidayDate: string
  name: string
}
