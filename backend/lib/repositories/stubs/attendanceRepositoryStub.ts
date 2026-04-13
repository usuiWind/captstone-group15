import { Attendance, CreateAttendanceInput } from '../../interfaces/models'
import { IAttendanceRepository } from '../../interfaces/repositories'

const attendances = new Map<string, Attendance>()

export const attendanceRepositoryStub: IAttendanceRepository = {
  findByUserId: async (userId: string): Promise<Attendance[]> => {
    return [...attendances.values()]
      .filter(a => a.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  },

  getTotalPoints: async (userId: string): Promise<number> => {
    return [...attendances.values()]
      .filter(a => a.userId === userId)
      .reduce((total, a) => total + a.points, 0)
  },

  create: async (data: CreateAttendanceInput): Promise<Attendance> => {
    const attendance: Attendance = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }
    attendances.set(attendance.id, attendance)
    return attendance
  },

  update: async (id: string, data: Partial<Pick<import('../../interfaces/models').Attendance, 'points' | 'eventName' | 'date'>>): Promise<import('../../interfaces/models').Attendance> => {
    const existing = attendances.get(id)
    if (!existing) throw new Error(`Attendance record ${id} not found`)
    const updated = { ...existing, ...data }
    attendances.set(id, updated)
    return updated
  },

  delete: async (id: string): Promise<void> => {
    attendances.delete(id)
  }
}
