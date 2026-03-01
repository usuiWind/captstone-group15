import { put } from '@vercel/blob'

export const uploadImage = async (file: File, filename: string): Promise<string> => {
  try {
    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    })
    
    return blob.url
  } catch (error) {
    console.error('Failed to upload image:', error)
    throw new Error('Failed to upload image')
  }
}

export const deleteImage = async (url: string): Promise<void> => {
  try {
    // Extract the blob URL from the full URL
    const blobUrl = new URL(url).pathname.substring(1)
    
    await fetch(`https://blob.vercel-storage.com/${blobUrl}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN!}`,
      },
    })
  } catch (error) {
    console.error('Failed to delete image:', error)
    throw new Error('Failed to delete image')
  }
}

export const validateImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
  }
  
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 5MB.')
  }
  
  return true
}
