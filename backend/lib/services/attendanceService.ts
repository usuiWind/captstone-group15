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

  async deleteAttendance(id: string): Promise<void> {
    await repositories.attendance.delete(id)
  }

  async getAllAttendance(): Promise<Attendance[]> {
    // This would need to be implemented in the repository
    // For now, return empty array
    return []
  }
}
