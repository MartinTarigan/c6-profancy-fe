export interface OvertimeLog {
    id: number
    baristaId: number
    userId: string
    outletId: number
    dateOvertime: string
    startHour: string
    duration: string
    reason: string
    status: string
    statusDisplay: string
    verifier: string | null
    outletName: string
    createdAt: string
    updatedAt: string
  }
  
  