import { StaffMember, CreateStaffInput } from '../interfaces/models'
import { repositories } from '../container'
import { uploadImage, deleteImage, validateImageFile } from '../upload'

export class StaffService {
  async getActiveStaff(): Promise<StaffMember[]> {
    return await repositories.staff.findAllActive()
  }

  async getStaffById(id: string): Promise<StaffMember | null> {
    return await repositories.staff.findById(id)
  }

  async createStaff(data: CreateStaffInput, imageFile?: File): Promise<StaffMember> {
    let imageUrl = data.imageUrl

    // Upload image if provided
    if (imageFile) {
      validateImageFile(imageFile)
      const filename = `staff/${Date.now()}-${imageFile.name}`
      imageUrl = await uploadImage(imageFile, filename)
    }

    return await repositories.staff.create({
      ...data,
      imageUrl
    })
  }

  async updateStaff(id: string, data: Partial<StaffMember>, imageFile?: File): Promise<StaffMember> {
    const existingStaff = await repositories.staff.findById(id)
    if (!existingStaff) {
      throw new Error('Staff member not found')
    }

    let imageUrl = data.imageUrl

    // Handle image update
    if (imageFile) {
      validateImageFile(imageFile)
      
      // Delete old image if it exists
      if (existingStaff.imageUrl) {
        try {
          await deleteImage(existingStaff.imageUrl)
        } catch (error) {
          console.error('Failed to delete old image:', error)
        }
      }
      
      // Upload new image
      const filename = `staff/${Date.now()}-${imageFile.name}`
      imageUrl = await uploadImage(imageFile, filename)
    }

    return await repositories.staff.update(id, {
      ...data,
      imageUrl
    })
  }

  async deleteStaff(id: string): Promise<void> {
    const staff = await repositories.staff.findById(id)
    if (staff && staff.imageUrl) {
      try {
        await deleteImage(staff.imageUrl)
      } catch (error) {
        console.error('Failed to delete staff image:', error)
      }
    }

    await repositories.staff.softDelete(id)
  }

  async getAllStaff(): Promise<StaffMember[]> {
    // This would need to be implemented in the repository
    // For now, return active staff
    return await repositories.staff.findAllActive()
  }
}
