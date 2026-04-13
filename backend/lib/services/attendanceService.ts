import { Attendance, CreateAttendanceInput } from '../interfaces/models'
import { repositories } from '../container'

export class AttendanceService {
  async getUserAttendance(userId: string): Promise<{ records: Attendance[], totalPoints: number }> {
    const records = await repositories.attendance.findByUserId(userId)
    const totalPoints = await repositories.attendance.getTotalPoints(userId)
    
    return { records, totalPoints }
  }

  async createAttendance(data: CreateAttendanceInput): Promise<Attendance> {
    return await repositories.attendance.create(data)
  }

  async updateAttendance(id: string, data: Partial<Pick<Attendance, 'points' | 'eventName' | 'date'>>): Promise<Attendance> {
    return await repositories.attendance.update(id, data)
  }

  async deleteAttendance(id: string): Promise<void> {
    await repositories.attendance.delete(id)
  }
}
