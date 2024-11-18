export default class Enrollment {
  constructor(readonly user_id: number, readonly enrolled_at: string, readonly completed_at: null | string, readonly percent_complete: number, readonly expires_at: null | string) {}

  isCompleted(): boolean {
    return !!this.isCompleted;
  }
}