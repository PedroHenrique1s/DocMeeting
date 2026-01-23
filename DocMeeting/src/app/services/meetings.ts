import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Meetings {
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
  );

  async saveMeeting(
    meetingData: any,
  ): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await this.supabase
      .from('meetings')
      .insert([meetingData])
      .select();
    return { data, error };
  }

  async getUserMeetings(userId: string) {
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async updateMeeting(id: string, newContent: string) {
    return await this.supabase
      .from('meetings')
      .update({ full_content: newContent })
      .eq('id', id)
      .select(); // Adicione o select para confirmar a transação
  }
  // Deletar a ata (DELETE)
  async deleteMeeting(id: string) {
    return await this.supabase.from('meetings').delete().eq('id', id);
  }
}
