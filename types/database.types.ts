export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          secret_key: string | null
          level: number
          created_at: string
        }
        Insert: {
          id: string
          secret_key?: string | null
          level?: number
        }
        Update: {
          id?: string
          secret_key?: string | null
          level?: number
        }
      }
      // We will add 'logs' and 'daily_stats' here later
    }
  }
}