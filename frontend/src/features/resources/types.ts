export interface Resource {
  id: string
  name: string
  resourceType: string
  description?: string
  capacity: number
  active: boolean
}

export interface CreateResourceInput {
  name: string
  resourceType: string
  description?: string
  capacity: number
  active: boolean
}
