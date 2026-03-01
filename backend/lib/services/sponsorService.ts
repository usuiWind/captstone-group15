import { Sponsor, CreateSponsorInput } from '../interfaces/models'
import { repositories } from '../container'
import { uploadImage, deleteImage, validateImageFile } from '../upload'

export class SponsorService {
  async getActiveSponsors(): Promise<Sponsor[]> {
    return await repositories.sponsor.findAllActive()
  }

  async getSponsorsByTier(): Promise<{ PLATINUM: Sponsor[], GOLD: Sponsor[], SILVER: Sponsor[], BRONZE: Sponsor[] }> {
    const sponsors = await this.getActiveSponsors()
    
    return {
      PLATINUM: sponsors.filter(s => s.tier === 'PLATINUM'),
      GOLD: sponsors.filter(s => s.tier === 'GOLD'),
      SILVER: sponsors.filter(s => s.tier === 'SILVER'),
      BRONZE: sponsors.filter(s => s.tier === 'BRONZE'),
    }
  }

  async getSponsorById(id: string): Promise<Sponsor | null> {
    return await repositories.sponsor.findById(id)
  }

  async createSponsor(data: CreateSponsorInput, logoFile: File): Promise<Sponsor> {
    validateImageFile(logoFile)
    const filename = `sponsors/${Date.now()}-${logoFile.name}`
    const logoUrl = await uploadImage(logoFile, filename)

    return await repositories.sponsor.create({
      ...data,
      logoUrl
    })
  }

  async updateSponsor(id: string, data: Partial<Sponsor>, logoFile?: File): Promise<Sponsor> {
    const existingSponsor = await repositories.sponsor.findById(id)
    if (!existingSponsor) {
      throw new Error('Sponsor not found')
    }

    let logoUrl = data.logoUrl

    // Handle logo update
    if (logoFile) {
      validateImageFile(logoFile)
      
      // Delete old logo
      try {
        await deleteImage(existingSponsor.logoUrl)
      } catch (error) {
        console.error('Failed to delete old logo:', error)
      }
      
      // Upload new logo
      const filename = `sponsors/${Date.now()}-${logoFile.name}`
      logoUrl = await uploadImage(logoFile, filename)
    }

    return await repositories.sponsor.update(id, {
      ...data,
      logoUrl
    })
  }

  async deleteSponsor(id: string): Promise<void> {
    const sponsor = await repositories.sponsor.findById(id)
    if (sponsor) {
      try {
        await deleteImage(sponsor.logoUrl)
      } catch (error) {
        console.error('Failed to delete sponsor logo:', error)
      }
    }

    await repositories.sponsor.softDelete(id)
  }

  async getAllSponsors(): Promise<Sponsor[]> {
    // This would need to be implemented in the repository
    // For now, return active sponsors
    return await repositories.sponsor.findAllActive()
  }
}
